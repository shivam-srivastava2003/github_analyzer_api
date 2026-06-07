/**
 * Async handler wrapper to catch and forward errors to the global handler.
 * Avoids boilerplate try/catch blocks in controller routes.
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Route Not Found middleware.
 */
const notFound = (req, res, next) => {
  const error = new Error(`Resource Not Found - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

/**
 * Global Error Handler middleware.
 */
const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const isProduction = process.env.NODE_ENV === 'production';

  console.error(`[Error] ${err.message}`);
  if (err.stack && !isProduction) {
    console.error(err.stack);
  }

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(isProduction ? {} : { stack: err.stack })
  });
};

module.exports = {
  asyncHandler,
  notFound,
  errorHandler
};
