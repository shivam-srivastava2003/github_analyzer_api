const axios = require('axios');
const db = require('../config/db');
const { analyzeProfile } = require('../utils/analyzer');

/**
 * Helper to get GitHub API request headers.
 */
function getGithubHeaders() {
  const headers = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'GitHub-Profile-Analyzer-API'
  };
  if (process.env.GITHUB_TOKEN) {
    headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
  }
  return headers;
}

/**
 * Fetch all repositories for a user by handling GitHub API pagination.
 */
async function fetchAllUserRepos(username, headers) {
  let repos = [];
  let page = 1;
  const perPage = 100;
  let hasMore = true;

  while (hasMore) {
    const response = await axios.get(`https://api.github.com/users/${username}/repos`, {
      headers,
      params: {
        per_page: perPage,
        page
      }
    });

    const pageRepos = response.data;
    if (!Array.isArray(pageRepos) || pageRepos.length === 0) {
      hasMore = false;
    } else {
      repos = repos.concat(pageRepos);
      if (pageRepos.length < perPage) {
        hasMore = false;
      } else {
        page++;
      }
    }
  }
  return repos;
}

/**
 * Parse JSON column values robustly.
 */
function parseJsonColumn(val) {
  if (!val) return null;
  if (typeof val === 'string') {
    try {
      return JSON.parse(val);
    } catch (e) {
      return null;
    }
  }
  return val;
}

class GitHubService {
  /**
   * Fetch user data from GitHub API, analyze it, and save/update in MySQL.
   * 
   * @param {string} username - GitHub username
   * @param {boolean} isRefresh - If true, update existing record, else insert
   */
  async analyzeAndSaveProfile(username, isRefresh = false) {
    const headers = getGithubHeaders();
    
    // 1. Fetch profile from GitHub
    let userResponse;
    try {
      userResponse = await axios.get(`https://api.github.com/users/${username}`, { headers });
    } catch (error) {
      if (error.response && error.response.status === 404) {
        const err = new Error(`GitHub user '${username}' not found`);
        err.statusCode = 404;
        throw err;
      }
      throw error;
    }

    const userData = userResponse.data;

    // 2. Fetch repositories
    let reposData = [];
    try {
      reposData = await fetchAllUserRepos(username, headers);
    } catch (error) {
      console.error(`Error fetching repos for ${username}: ${error.message}`);
      // Proceed with empty repos if repos fetch fails but user exists, or let it bubble up.
      // Usually, it's safer to bubble up or fallback. We bubble up.
      throw error;
    }

    // 3. Compute analytics
    const analysis = analyzeProfile(userData, reposData);

    // Prepare fields for insertion/update
    const record = {
      username: userData.login, // Use canonical username from GitHub API
      name: userData.name || null,
      bio: userData.bio || null,
      avatar_url: userData.avatar_url || null,
      github_url: userData.html_url,
      followers: analysis.followers,
      following: analysis.following,
      public_repos: analysis.public_repos,
      public_gists: analysis.public_gists,
      account_created_at: analysis.account_created_at,
      top_language: analysis.top_language,
      total_stars: analysis.total_stars,
      total_forks: analysis.total_forks,
      engagement_score: analysis.engagement_score,
      profile_level: analysis.profile_level,
      languages_breakdown: JSON.stringify(analysis.languages_breakdown),
      top_repos: JSON.stringify(analysis.top_repos)
    };

    if (isRefresh) {
      const query = `
        UPDATE github_profiles 
        SET name = ?, bio = ?, avatar_url = ?, github_url = ?, 
            followers = ?, following = ?, public_repos = ?, public_gists = ?, 
            account_created_at = ?, top_language = ?, total_stars = ?, total_forks = ?, 
            engagement_score = ?, profile_level = ?, languages_breakdown = ?, top_repos = ?,
            analysis_date = CURRENT_TIMESTAMP
        WHERE LOWER(username) = LOWER(?)
      `;
      await db.query(query, [
        record.name, record.bio, record.avatar_url, record.github_url,
        record.followers, record.following, record.public_repos, record.public_gists,
        record.account_created_at, record.top_language, record.total_stars, record.total_forks,
        record.engagement_score, record.profile_level, record.languages_breakdown, record.top_repos,
        username
      ]);
    } else {
      const query = `
        INSERT INTO github_profiles (
          username, name, bio, avatar_url, github_url, 
          followers, following, public_repos, public_gists, 
          account_created_at, top_language, total_stars, total_forks, 
          engagement_score, profile_level, languages_breakdown, top_repos
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      await db.query(query, [
        record.username, record.name, record.bio, record.avatar_url, record.github_url,
        record.followers, record.following, record.public_repos, record.public_gists,
        record.account_created_at, record.top_language, record.total_stars, record.total_forks,
        record.engagement_score, record.profile_level, record.languages_breakdown, record.top_repos
      ]);
    }

    // Retrieve and return the updated/saved record
    return this.getProfileByUsername(record.username);
  }

  /**
   * Fetch profile from the local database (cache lookup).
   * 
   * @param {string} username - GitHub username
   */
  async getProfileByUsername(username) {
    const query = 'SELECT * FROM github_profiles WHERE LOWER(username) = LOWER(?)';
    const [rows] = await db.query(query, [username]);
    
    if (rows.length === 0) {
      return null;
    }

    const profile = rows[0];
    profile.languages_breakdown = parseJsonColumn(profile.languages_breakdown);
    profile.top_repos = parseJsonColumn(profile.top_repos);
    return profile;
  }

  /**
   * Fetch all analyzed profiles with search, sort, and pagination support.
   */
  async getAllProfiles({ page = 1, limit = 10, sort = 'analysis_date', order = 'DESC', search = '' }) {
    const parsedPage = Math.max(1, parseInt(page, 10));
    const parsedLimit = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const offset = (parsedPage - 1) * parsedLimit;

    // Validate sort fields to prevent SQL injection
    const allowedSortColumns = [
      'username', 'name', 'followers', 'following', 
      'public_repos', 'public_gists', 'total_stars', 
      'total_forks', 'engagement_score', 'analysis_date'
    ];
    const sortColumn = allowedSortColumns.includes(sort) ? sort : 'analysis_date';
    const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // Prepare search filter
    const searchPattern = `%${search}%`;
    
    // Query total count for pagination metadata
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM github_profiles 
      WHERE username LIKE ? OR name LIKE ?
    `;
    const [countRows] = await db.query(countQuery, [searchPattern, searchPattern]);
    const totalItems = countRows[0].total;

    // Fetch records
    const dataQuery = `
      SELECT * 
      FROM github_profiles 
      WHERE username LIKE ? OR name LIKE ? 
      ORDER BY ${sortColumn} ${sortOrder} 
      LIMIT ? OFFSET ?
    `;
    const [rows] = await db.query(dataQuery, [searchPattern, searchPattern, parsedLimit, offset]);

    // Parse JSON columns for returned profiles
    const profiles = rows.map(profile => {
      profile.languages_breakdown = parseJsonColumn(profile.languages_breakdown);
      profile.top_repos = parseJsonColumn(profile.top_repos);
      return profile;
    });

    const totalPages = Math.ceil(totalItems / parsedLimit);

    return {
      metadata: {
        totalItems,
        totalPages,
        currentPage: parsedPage,
        limit: parsedLimit,
        sortColumn,
        sortOrder
      },
      profiles
    };
  }

  /**
   * Delete profile by username.
   */
  async deleteProfile(username) {
    const query = 'DELETE FROM github_profiles WHERE LOWER(username) = LOWER(?)';
    const [result] = await db.query(query, [username]);
    return result.affectedRows > 0;
  }
}

module.exports = new GitHubService();
