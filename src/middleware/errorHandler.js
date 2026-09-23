const { HTTP_STATUS } = require('../constants');

const notFoundHandler = (req, res, next) => {
  res.status(HTTP_STATUS.NOT_FOUND).json({
    success: false,
    message: `Resource not found: ${req.method} ${req.originalUrl}`
  });
};

const globalErrorHandler = (err, req, res, next) => {
  console.error('[SERVER ERROR]:', err);

  const statusCode = err.statusCode || HTTP_STATUS.INTERNAL_ERROR;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'An internal server error occurred.',
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {})
  });
};

module.exports = { notFoundHandler, globalErrorHandler };
