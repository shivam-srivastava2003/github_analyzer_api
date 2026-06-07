require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const { rateLimit } = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const requestLogger = require('./middleware/requestLogger');
const githubRoutes = require('./routes/githubRoutes');
const githubController = require('./controllers/githubController');
const { notFound, errorHandler, asyncHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// ==========================================
// Security Middlewares
// ==========================================
// Helmet helps secure the app by setting various HTTP headers
app.use(helmet());

// Enable Cross-Origin Resource Sharing (CORS)
app.use(cors());

// Rate Limiter to prevent brute force or abuse
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // Default 15 mins
  max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10), // Default 100 requests per window
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes.'
  }
});
app.use(limiter);

// ==========================================
// Logging & Body Parsers
// ==========================================
app.use(requestLogger);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==========================================
// Swagger Documentation
// ==========================================
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'GitHub Profile Analyzer API',
      version: '1.0.0',
      description: 'A production-ready Express service that fetches, analyzes, and caches GitHub profile and repo statistics.',
      contact: {
        name: 'Developer Support'
      }
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: 'Local development server'
      }
    ]
  },
  // Path to the API docs (files containing JSdoc/swagger comments)
  apis: ['./src/routes/*.js']
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ==========================================
// Core Routes
// ==========================================
// API Health Check
app.get('/health', asyncHandler(githubController.healthCheck.bind(githubController)));

// GitHub Analyzer API Routes
app.use('/api', githubRoutes);

// Root path redirection/welcome
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to the GitHub Profile Analyzer API. Access documentation at /api-docs and health check at /health.'
  });
});

// ==========================================
// Error Handling
// ==========================================
app.use(notFound);
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`Server is running in ${process.env.NODE_ENV || 'development'} mode`);
  console.log(`Listening on http://localhost:${PORT}`);
  console.log(`API Documentation available at http://localhost:${PORT}/api-docs`);
  console.log(`====================================================`);
});

module.exports = app;
