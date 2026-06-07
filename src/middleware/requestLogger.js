const morgan = require('morgan');

// Determine log format based on current environment
const format = process.env.NODE_ENV === 'production' ? 'combined' : 'dev';

const requestLogger = morgan(format);

module.exports = requestLogger;
