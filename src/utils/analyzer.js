/**
 * Analyzes raw GitHub user profile and repository data to compute insights.
 * 
 * @param {Object} userProfile - Raw profile object from GitHub API
 * @param {Array} repos - Array of raw repository objects from GitHub API
 * @returns {Object} Calculated metrics and insights
 */
function analyzeProfile(userProfile, repos) {
  const followers = userProfile.followers || 0;
  const public_repos = userProfile.public_repos || 0;
  const following = userProfile.following || 0;
  const public_gists = userProfile.public_gists || 0;

  // Initialize accumulators
  let totalStars = 0;
  let totalForks = 0;
  const languageCounts = {};

  // Parse repo data
  if (Array.isArray(repos)) {
    repos.forEach(repo => {
      totalStars += repo.stargazers_count || 0;
      totalForks += repo.forks_count || 0;
      if (repo.language) {
        languageCounts[repo.language] = (languageCounts[repo.language] || 0) + 1;
      }
    });
  }

  // Calculate top language
  let topLanguage = null;
  let maxCount = 0;
  for (const [lang, count] of Object.entries(languageCounts)) {
    if (count > maxCount) {
      maxCount = count;
      topLanguage = lang;
    }
  }

  // Calculate account age in years
  const createdAt = new Date(userProfile.created_at);
  const now = new Date();
  const diffTime = Math.abs(now - createdAt);
  const accountAgeYears = parseFloat((diffTime / (1000 * 60 * 60 * 24 * 365.25)).toFixed(1));

  // Custom Engagement Score calculation:
  // engagement_score = followers * 0.4 + repos * 0.3 + stars * 0.3
  const engagementScore = parseFloat(
    (followers * 0.4 + public_repos * 0.3 + totalStars * 0.3).toFixed(2)
  );

  // Profile Level classification:
  // 0-30 = Beginner, 31-60 = Intermediate, 61-80 = Advanced, 81-100 (and above) = Expert
  let profileLevel = 'Beginner';
  if (engagementScore > 80) {
    profileLevel = 'Expert';
  } else if (engagementScore > 60) {
    profileLevel = 'Advanced';
  } else if (engagementScore > 30) {
    profileLevel = 'Intermediate';
  }

  // Top 5 Starred Repositories
  const topRepos = Array.isArray(repos)
    ? [...repos]
        .sort((a, b) => (b.stargazers_count || 0) - (a.stargazers_count || 0))
        .slice(0, 5)
        .map(repo => ({
          name: repo.name,
          description: repo.description || null,
          stars: repo.stargazers_count || 0,
          forks: repo.forks_count || 0,
          url: repo.html_url
        }))
    : [];

  return {
    followers,
    following,
    public_repos,
    public_gists,
    account_created_at: createdAt,
    account_age_years: accountAgeYears,
    top_language: topLanguage,
    total_stars: totalStars,
    total_forks: totalForks,
    engagement_score: engagementScore,
    profile_level: profileLevel,
    languages_breakdown: languageCounts,
    top_repos: topRepos
  };
}

module.exports = {
  analyzeProfile
};
