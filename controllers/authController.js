const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const jwt = require('jsonwebtoken');
const AppError = require('./../utils/appError');
const { promisify } = require('util'); // use the promisify method
const sendEmail = require('./../utils/email');
const crypto = require('crypto'); // node's built-in module

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

// Browsers automatically stores data in cookies and send it back to the browser
// in each request
// So we want to store the token in cookie so clients can send it back to the server
// automatically
const signAndSendToken = (user, res, statusCode) => {
  const token = signToken(user.id);
  const cookieOptions = {
    // 90 days * 24 hours * 60 minutes * 60 seconds * 1000 milliseconds
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true, // cookie cannot be accessed or modified in any way by the browser, that's to prevent XSS attacks
    // that also makes the browser to send the cookie automatically in every request
  };

  // send it only through https, this is only for production
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  res.cookie('jwt', token, cookieOptions);

  res.status(statusCode).json({
    status: 'success',
    token: token,
    data: {
      user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });

  // Don't send encrypted pwd to the user
  newUser.password = undefined;

  signAndSendToken(newUser, res, 201);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) Check if email and password exist
  if (!email || !password) {
    // use return so the function finishes right away, otherwise
    // you will see an error like: Cannot set headers after they are
    // sent to the client
    return next(new AppError('Please provide email and password', 400));
  }
  // 2) Check if user exists and password is correct
  // We set our schema to not select password and password confirmation on fetch
  // therefore we need to manually query for that field
  const user = await User.findOne({ email: email }).select('+password');

  // if user does not exist it won't execute the correctPassword function
  // that's to save computation or passing undefined values to the function
  if (!user || !(await user.correctPassword(password, user.password))) {
    // 401 is unauthorized
    return next(new AppError('Incorrect email or password', 401));
  }

  // 3) If everything ok, send token to client
  signAndSendToken(user, res, 200);
});

// This route is only for rendered pages where user logs out from the server through a link
exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({
    status: 'success',
  });
};

// Express set all header names to lowercase
// for Authorization: Bearer my_token, translates to authorization: Bearer my_token
exports.protect = catchAsync(async (req, res, next) => {
  // 1) Get token and check if it's there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    // This is when the user sends the jwt through cookies
    // for instance, when the authenticate through the login form
    // and then navigating throughout the site
    token = req.cookies.jwt;
  }

  if (!token) {
    // 401 unauthorized
    return next(
      new AppError('You are not logged in! Please log in to get access', 401)
    );
  }

  // 2) verification token
  // jwt.verify executes a callback once the verification is completed
  //where are gonna turn this into a promise instead
  // jwt.verify return the decoded token, where can see the id of the user, for example
  // { id: '6659c8c26694f1dd1fc34db5', iat: 1717185668, exp: 1717272068 }
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3) Check if user still exists
  const freshUser = await User.findById(decoded.id);

  if (!freshUser) {
    return next(
      new AppError('The token belonging to the user no longer exists', 401)
    );
  }

  // 4) Check if user changed password after the token was issued
  // iat stands for issued at
  if (freshUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password! Please log in again', 401)
    );
  }
  // GRANT ACCESS TO PROTECTED ROUTE
  // we set req.user so we can use that user in the next middleware function
  // remember that the req object travels from middleware to middleware
  req.user = freshUser;

  next();
});

// this middleware is to determine if the user is logged in or not
// And it's only for rendered pages, no need to pass error to global
// error middleware
exports.isLoggedIn = async (req, res, next) => {
  // We are manually catching errors here because when user logs out
  // we set a dummy string to the json web token and this function is run
  // everytime we land on a page, meaning the token is verified by jwt.verify
  // triggering a jwt malformed error so we basically want to move forward if this error happens
  try {
    // 1) Verify if token comes from cookies
    if (req.cookies.jwt) {
      token = req.cookies.jwt;

      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );

      // 2) Check if user still exists
      const currentUser = await User.findById(decoded.id);

      if (!currentUser) {
        return next();
      }

      // 3) Check if user changed password after the token was issued
      // iat stands for issued at
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }

      // THERE IS A LOGGED IN USER
      // res.locals is available through all our pug templates
      res.locals.user = currentUser;

      return next();
    }
  } catch (err) {
    return next();
  }

  // If there is a not logged in user, move on
  res.locals.user = undefined;
  next();
};

// Roles is an array of roles
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // Remember that req.user is passed to middleware
    // check the protect middleware
    if (!roles.includes(req.user.role)) {
      // 403 forbidden
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on posted email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('There is no user with that email', 404));
  }

  //user.changedPasswordAfter(Date.now());
  // 2) Generate random reset token
  // This is the unencrypted token, the encrypted one is saved in the DB
  const resetToken = user.createPasswordResetToken();
  // Skip validations before saving encrypted token
  await user.save({ validateBeforeSave: false });

  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;
  //next();
  // 3) Send it to the user's email
  const message = `Forgot your password? Submit a PATCH request with your new password and confirm to: ${resetURL}\nIf you didn't forget your password, please ignore this email`;

  // In case there's an error sending the email, send reset back
  // the user's passwordResetToken and passwordResetExpires
  try {
    await sendEmail({
      email: user.email,
      subject: 'Your password reset token (valid for 10 minutes)',
      message,
    });

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email',
    });
  } catch (e) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(
      new AppError('There was an error sending the email. Try again later', 500)
    );
  }
});

// This route is used when user resets password through reset token
exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on the token
  // req.params.token is the unencrypted token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  // Check also if token has not expired yet
  // Behind the scenes mongoose converts date to match the one in the DB
  // in order to do the comparison
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // 2) Set the new password only if password has not expired
  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }

  //remember there is a pre save hook that encrypts the password
  // and then clears out the passwordConfirm field
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  // 3) Update user.changedPasswordAt to `Date.now()`, this is done
  // in th model as a pre save hook
  // 4) Log the user in, send JWT
  signAndSendToken(user, res, 200);
});

// This route is used when user manually updates password through the website
// of course this is only for logged in users
exports.updatePassword = catchAsync(async (req, res, next) => {
  // For security always ask for the current password before updating to a new one
  // 1) Get user from collection
  const user = await User.findById(req.user.id).select('+password');
  // 2) check if POSted pwd is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Your current password is invalid', 401));
  }
  // 3) If so, update user
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save(); // DOnt user findByIdAndUpdate when updating pwds because pwd validations won't run, they only run on .save and when creating a new document

  // 4) Log user in, send JWT
  signAndSendToken(user, res, 200);
});
