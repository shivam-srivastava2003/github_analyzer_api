const githubService = require('../services/githubService');
const db = require('../config/db');

class GitHubController {
  /**
   * POST /api/profiles/analyze
   * Analyzes a GitHub profile. Checks cache first.
   */
  async analyzeProfile(req, res) {
    const { username } = req.body;

    // Cache lookup
    const cachedProfile = await githubService.getProfileByUsername(username);

    if (cachedProfile) {
      return res.status(200).json({
        success: true,
        message: 'Profile retrieved from cache',
        data: cachedProfile
      });
    }

    // Cache miss: analyze and save
    const profile = await githubService.analyzeAndSaveProfile(username, false);

    return res.status(201).json({
      success: true,
      message: 'Profile analyzed successfully',
      data: profile
    });
  }

  /**
   * GET /api/profiles
   * Gets a list of all analyzed profiles with search, sort, and pagination.
   */
  async getAllProfiles(req, res) {
    const { page = 1, limit = 10, sort = 'analysis_date', order = 'DESC', search = '' } = req.query;

    const result = await githubService.getAllProfiles({
      page,
      limit,
      sort,
      order,
      search
    });

    return res.status(200).json({
      success: true,
      metadata: result.metadata,
      data: result.profiles
    });
  }

  /**
   * GET /api/profiles/:username
   * Retrieve a single analyzed profile from the database.
   */
  async getProfileByUsername(req, res) {
    const { username } = req.params;

    const profile = await githubService.getProfileByUsername(username);

    if (!profile) {
      const err = new Error(`Profile for user '${username}' not found in database`);
      err.statusCode = 404;
      throw err;
    }

    return res.status(200).json({
      success: true,
      data: profile
    });
  }

  /**
   * DELETE /api/profiles/:username
   * Deletes a profile from the database.
   */
  async deleteProfile(req, res) {
    const { username } = req.params;

    const deleted = await githubService.deleteProfile(username);

    if (!deleted) {
      const err = new Error(`Profile for user '${username}' not found in database`);
      err.statusCode = 404;
      throw err;
    }

    return res.status(200).json({
      success: true,
      message: `Profile for user '${username}' deleted successfully`
    });
  }

  /**
   * POST /api/profiles/:username/refresh
   * Re-fetches GitHub API data and updates the profile in the database.
   */
  async refreshProfile(req, res) {
    const { username } = req.params;

    // Check if the user is already stored in the DB
    const existing = await githubService.getProfileByUsername(username);

    if (!existing) {
      const err = new Error(`Profile for user '${username}' does not exist in the database. Use analyze endpoint first.`);
      err.statusCode = 404;
      throw err;
    }

    // Refresh and update
    const updatedProfile = await githubService.analyzeAndSaveProfile(username, true);

    return res.status(200).json({
      success: true,
      message: 'Profile refreshed successfully',
      data: updatedProfile
    });
  }

  /**
   * GET /health
   * Simple system and database connection check.
   */
  async healthCheck(req, res) {
    try {
      // Run quick query to verify DB connection
      await db.query('SELECT 1');
      return res.status(200).json({
        success: true,
        status: 'UP',
        timestamp: new Date().toISOString(),
        database: 'Connected'
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        status: 'DOWN',
        timestamp: new Date().toISOString(),
        database: 'Disconnected',
        error: error.message
      });
    }
  }
}

module.exports = new GitHubController();
