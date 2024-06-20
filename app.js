const path = require('path'); //native built-on module
const express = require('express');
const morgan = require('morgan');
const tourRouter = require('./routes/toursRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewsRoutes');
const viewRouter = require('./routes/viewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorsController');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet'); // helps setting secure http headers
const mongoSanitize = require('express-mongo-sanitize');
const xssClean = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const compression = require('compression');

const app = express();
// This is to trust proxies for secure connections, if so,
// the x-forwarded-proto header is set to https meaning our connection
// is secure
app.enable('trust proxy');
// Express support pug templates out of the box, no need to install additional packages
// nevertheless install the pug package
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// Make public directory accessible to serve static files
app.use(express.static(path.join(__dirname, 'public')));

// 1) Global middleware

// Important to call this line in the beginning
// Set security http headers, once set up you will be able to see
// the following headers
// X-DNS-Prefetch-Control helps control DNS prefetching, which can improve user privacy at the expense of performance
// be careful because react uses prefetching, so maybe you need to turn this on, off by default
// Strict-Transport-Security Tells browsers to prefer HTTPS
// X-Download-Options Forces downloads to be saved (Internet Explorer only)
// X-XSS-Protection Legacy header that tries to mitigate XSS attacks, but makes things worse, so Helmet disables it
// More info about header: https://github.com/helmetjs/helmet?tab=readme-ov-file#helmet
app.use(helmet());

// middleware to compress server responses like texts/json
app.use(compression());

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev')); // Logs reqs to console
}

// Here we define how many request per hour (60mins*60sec*1000millisecs) we want
// from a single IP address
// Helps preventing Denial of service and brute force attacks
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000, // Value in milliseconds
  message: 'Too many requests from this IP, please try again in an hour',
});

// The rate limitting only applies to our /api namespace
// In order to check this works, check these values in the header:
// X-RateLimit-Limit -> which should be 100 in this case
// X-RateLimit-Remaining -> which should be the remaining for that IP
// X-RateLimit-Reset -> The future date in milliseconds when the rate limit will reset
app.use('/api', limiter);

// This middleware will parse the JSON data in the request body
// and make it accessible in your route handlers as req.body.
// As a security measure we should restrict the size of the JSON
// that comes in our request body, so for this app we limit it to 10kb
// body greater than 10KB won't be accepted
app.use(express.json({ limit: '10kb' }));

// This middleware will parse the URL encoded data in the request body
// e.g when user is in /me and submit changes like name and password
app.use(express.urlencoded({ extend: true, limit: '10kb' }));

//Using cookie-parser to parse data from the cookies with set in the client
// once they authenticate, see more at: signAndSendToken
app.use(cookieParser());
// Data sanizitation, cleans all incoming data from malicious code
// perfect place to do it here since sanitization must happen
// after data is parsed
// 1. Data sanitization against NoSQL query injection
// in /api/v1/users/login use this body to check a real SQL injection
// { "email": {"$gt": ""}, "password": "any-user-password-you-have" }
// This query is able to fetch all users if a password matches
app.use(mongoSanitize()); // Checks req.body and req.params and filters out malicious code

// 2. Data sanitization against XSS
// cleans user input from html malicious code, let's say an user injecting a script in a comment
// or an user passing html/js when creating an account in the req.body
app.use(xssClean());

// Protect against parameter pollution, let's say someone making a request like:
// api/v1/tours?sort=duration&sort=-name, this param is duplicated and it will break our code
// because we treat the sort param as a string, not as an array, hpp (http parameter pollution)
// will clean the query params and choose one of them. Nevertheless there are times when we want
// duplicate params, e.g. when filtering by multiple durations (api/v1/tours?duration=5&duration=9)
// in that case we can whitelist this param
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsAverage',
      'ratingsQuantity',
      'difficulty',
      'price',
    ],
  })
);

// This middleware function applies to all requests
// It is usually defined at the top level, not after response handlers
// because the end the request/response cycle
// This is just for education purposes
// app.use((req, res, next) => {
//   console.log(
//     'cookies are after we added the cookieParser middleware: ',
//     req.cookies
//   );
//   // Mandatory to always call next, otherwise the app would be stuck
//   next();
// });

//views handler
app.use('/', viewRouter);

// API Routes
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

// Handle every other route
// Order matters here, this middleware is for handling 404 requests
app.all('*', (req, res, next) => {
  // res.status(404).json({
  //   status: 'fail',
  //   message: `Can't find ${req.originalUrl} on this server`,
  // });
  // const err = new Error(`Can't find ${req.originalUrl} on this server`);
  // err.status = 'fail';
  // err.statusCode = 404;
  // next(err);

  // This is error is passed to middleware below
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

// global error handling middleware for operational errors(db connections, routes, models, etc)
// everything that we could anticipate to happen and what we have a handlers, for instance
// someone trying to fetch a tour with an incorrect identifier
// when we specify these 4 params, express know that this is for error handling
app.use(globalErrorHandler);

module.exports = app;
