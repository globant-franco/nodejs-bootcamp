module.exports = (fn) => {
  // All async functions return a promise, meaning if we call .catch
  // then it is like a try catch block
  // Calling .next will call the globalErrorHandler with the given error
  // this function should return a function that express will call when the
  // controller action is called
  return (req, res, next) => {
    fn(req, res, next).catch((err) => next(err));
    // catch function can also be written as:
    // .catch(next()) and it will pass down the error object
  };
};
