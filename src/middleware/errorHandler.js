/**
 * Centralized Error Handler Middleware.
 * Must be registered LAST, after all routes in app.js/index.js.
 * Controllers forward errors via next(error).
 */

const logger = require("../utils/logger");

const errorHandler = (err, req, res, next) => {
  logger.error(err.message, { stack: err.stack });

  const statusCode = err.status || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
    data: null,
  });
};

module.exports = errorHandler;
