class ErrorHandler extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

const handleError = (err, res) => {
  const statusCode = err.statusCode || '500';
  const message = err.message || 'Internal server error';
  res.status(statusCode).json({
    status: 'error',
    statusCode,
    message
  });
};

module.exports = { handleError, ErrorHandler };
