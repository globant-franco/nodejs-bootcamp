const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const factory = require('./handlerFactory');

const filterObject = (obj, ...allowedFields) => {
  const filteredObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) {
      filteredObj[el] = obj[el];
    }
  });
  return filteredObj;
};

// CRUD actions only for admins
exports.getUsers = factory.getAll(User);
exports.getUser = factory.getOne(User);
exports.createUser = factory.createOne(User);
exports.deleteUser = factory.deleteOne(User);
// Do NOT update password in this action
exports.updateUser = factory.updateOne(User);

// Actions that can only be performed by current logged in users

// Middleware function to implement /me and reusing factory.getOne
// to basically hardcode the userId to current logged in user
exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

// Allow logged in users to only update their name and email
exports.updateMe = catchAsync(async (req, res, next) => {
  // 1) Create error if user POSTs password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates. Please use /updatePassword',
        400
      )
    );
  }
  // 2) Get user from collection
  // Use findByIdAndUpdate in order to bypass the password validations that run on .create and .save
  const allowedParams = filterObject(req.body, 'name', 'email');
  const updatedUser = await User.findByIdAndUpdate(req.user.id, allowedParams, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });
  // 204 no content
  res.status(204).json({
    status: 'success',
    data: null,
  });
});
