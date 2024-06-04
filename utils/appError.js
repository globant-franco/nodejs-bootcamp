class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true; // errors like db connections, routes, models, etc
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
