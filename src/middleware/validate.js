/**
 * GitHub Username Regex:
 * - Alphanumeric characters or single hyphens
 * - Cannot start or end with a hyphen
 * - Max 39 characters
 * - Cannot contain double hyphens
 */
const GITHUB_USERNAME_REGEX = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;

/**
 * Validate that the username in the request body is valid.
 */
const validateUsernameBody = (req, res, next) => {
  const { username } = req.body;

  if (username === undefined || username === null || String(username).trim() === '') {
    const err = new Error('Username is required');
    err.statusCode = 400;
    return next(err);
  }

  const trimmedUsername = String(username).trim();

  if (!GITHUB_USERNAME_REGEX.test(trimmedUsername)) {
    const err = new Error('Invalid GitHub username format');
    err.statusCode = 400;
    return next(err);
  }

  // Update req.body with trimmed username
  req.body.username = trimmedUsername;
  next();
};

/**
 * Validate that the username in the request parameters is valid.
 */
const validateUsernameParam = (req, res, next) => {
  const { username } = req.params;

  if (username === undefined || username === null || String(username).trim() === '') {
    const err = new Error('Username parameter is required');
    err.statusCode = 400;
    return next(err);
  }

  const trimmedUsername = String(username).trim();

  if (!GITHUB_USERNAME_REGEX.test(trimmedUsername)) {
    const err = new Error('Invalid GitHub username format');
    err.statusCode = 400;
    return next(err);
  }

  // Update req.params with trimmed username
  req.params.username = trimmedUsername;
  next();
};

/**
 * Validate query parameters for listing profiles.
 */
const validateGetProfilesQuery = (req, res, next) => {
  const { page, limit, sort, order } = req.query;

  if (page !== undefined && (isNaN(page) || parseInt(page, 10) < 1)) {
    const err = new Error('Query parameter "page" must be a positive integer');
    err.statusCode = 400;
    return next(err);
  }

  if (limit !== undefined && (isNaN(limit) || parseInt(limit, 10) < 1)) {
    const err = new Error('Query parameter "limit" must be a positive integer');
    err.statusCode = 400;
    return next(err);
  }

  const allowedSortColumns = [
    'username', 'name', 'followers', 'following', 
    'public_repos', 'public_gists', 'total_stars', 
    'total_forks', 'engagement_score', 'analysis_date'
  ];

  if (sort !== undefined && !allowedSortColumns.includes(sort)) {
    const err = new Error(`Query parameter "sort" must be one of: ${allowedSortColumns.join(', ')}`);
    err.statusCode = 400;
    return next(err);
  }

  if (order !== undefined && !['asc', 'desc'].includes(order.toLowerCase())) {
    const err = new Error('Query parameter "order" must be "asc" or "desc"');
    err.statusCode = 400;
    return next(err);
  }

  next();
};

module.exports = {
  validateUsernameBody,
  validateUsernameParam,
  validateGetProfilesQuery
};
