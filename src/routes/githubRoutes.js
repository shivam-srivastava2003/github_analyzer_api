const express = require('express');
const router = express.Router();
const githubController = require('../controllers/githubController');
const { asyncHandler } = require('../middleware/errorHandler');
const {
  validateUsernameBody,
  validateUsernameParam,
  validateGetProfilesQuery
} = require('../middleware/validate');

/**
 * @swagger
 * /api/profiles/analyze:
 *   post:
 *     summary: Analyze a GitHub profile
 *     description: Checks if the profile analysis exists in cache. If not, fetches from GitHub API, analyzes, saves, and returns the data.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *             properties:
 *               username:
 *                 type: string
 *                 example: torvalds
 *     responses:
 *       200:
 *         description: Profile retrieved from cache
 *       201:
 *         description: Profile analyzed successfully
 *       400:
 *         description: Invalid or empty username
 *       404:
 *         description: GitHub user not found
 *       500:
 *         description: Server error
 */
router.post(
  '/profiles/analyze',
  validateUsernameBody,
  asyncHandler(githubController.analyzeProfile.bind(githubController))
);

/**
 * @swagger
 * /api/profiles:
 *   get:
 *     summary: Get all analyzed profiles
 *     description: Returns a paginated list of all stored profiles, with search and sorting.
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of profiles per page
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           default: analysis_date
 *         description: Column to sort by (username, name, followers, following, public_repos, public_gists, total_stars, total_forks, engagement_score, analysis_date)
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           default: DESC
 *           enum: [ASC, DESC, asc, desc]
 *         description: Sort order
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search query matching username or name
 *     responses:
 *       200:
 *         description: Success
 *       400:
 *         description: Invalid query parameters
 *       500:
 *         description: Server error
 */
router.get(
  '/profiles',
  validateGetProfilesQuery,
  asyncHandler(githubController.getAllProfiles.bind(githubController))
);

/**
 * @swagger
 * /api/profiles/{username}:
 *   get:
 *     summary: Get single profile by username
 *     description: Retrieves the analyzed profile data for a specific user from the database.
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema:
 *           type: string
 *         description: GitHub username
 *     responses:
 *       200:
 *         description: Success
 *       400:
 *         description: Invalid username format
 *       404:
 *         description: Profile not found in database
 *       500:
 *         description: Server error
 */
router.get(
  '/profiles/:username',
  validateUsernameParam,
  asyncHandler(githubController.getProfileByUsername.bind(githubController))
);

/**
 * @swagger
 * /api/profiles/{username}:
 *   delete:
 *     summary: Delete a profile
 *     description: Deletes an analyzed profile from the database.
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema:
 *           type: string
 *         description: GitHub username
 *     responses:
 *       200:
 *         description: Profile deleted successfully
 *       400:
 *         description: Invalid username format
 *       404:
 *         description: Profile not found in database
 *       500:
 *         description: Server error
 */
router.delete(
  '/profiles/:username',
  validateUsernameParam,
  asyncHandler(githubController.deleteProfile.bind(githubController))
);

/**
 * @swagger
 * /api/profiles/{username}/refresh:
 *   post:
 *     summary: Refresh profile analysis
 *     description: Re-fetches the latest profile and repositories data from GitHub API, re-calculates metrics, and updates the existing record.
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema:
 *           type: string
 *         description: GitHub username
 *     responses:
 *       200:
 *         description: Profile refreshed successfully
 *       400:
 *         description: Invalid username format
 *       404:
 *         description: Profile not found in database
 *       500:
 *         description: Server error
 */
router.post(
  '/profiles/:username/refresh',
  validateUsernameParam,
  asyncHandler(githubController.refreshProfile.bind(githubController))
);

module.exports = router;
