const AppError = require('./../utils/appError').default;

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

const handleJWTError = () =>
  new AppError('Invalid token. Please login again.', 401);

const handleJWTExpiredError = () =>
  new AppError('Token expired. Please login again.', 401);

const handleDuplicateFieldsDB = (err) => {
  //const value = err.errmsg.match(/(["'])(\\?.)*?\1/g)[0];
  const value = err.keyValue.name;
  const message = `Duplicate field value: ${value}. Please use another value`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((err) => err.message);
  const message = `Invalid input data: ${errors.join(', ')}`;
  return new AppError(message, 400);
};

// We need to differentiate between api errors and rendered page errors
const sendErrorDev = (req, res, err) => {
  // API errors
  if (req.originalUrl.startsWith('/api')) {
    res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  } else {
    // RENDERED WEBSITE
    res.status(err.statusCode).render('error', {
      title: 'Something went wrong',
      msg: err.message,
    });
  }
};

const sendErrorProd = (req, res, err) => {
  if (req.originalUrl.startsWith('/api')) {
    // Operational, trusted error: send message to client
    // By default all errors are operational
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    }
    console.error('Error 🤯', err);
    // Programming or other unknown error:
    // dont leak error details
    return res.status(500).json({
      status: 'error',
      message: 'Something went wrong',
    });
  } else {
    // RENDERED WEBSITE
    res.status(err.statusCode).render('error', {
      title: 'Something went wrong',
      msg: 'Please try again later',
    });
  }
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(req, res, err);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    error.message = err.message; // errors coming from views controller

    // mongoose errors
    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.errors.name) error = handleValidationErrorDB(error);
    sendErrorProd(req, res, error);
    // Error handling when token is invalid
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();
  }
};
