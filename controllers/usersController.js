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

exports.getUsers = factory.getAll(User);
exports.getUser = factory.getOne(User);

// These 2 controller actions are only for admin users
exports.deleteUser = factory.deleteOne(User);
// Do NOT update password in this action
exports.updateUser = factory.updateOne(User);

// This function is to only allow logged in users to update their name and email
exports.updateMe = catchAsync(async (req, res, next) => {
  // 1) Create error if user POSTs password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates. Please use /updateMyPassword',
        400
      )
    );
  }
  // 2) Get user from collection
  // Use findByIdAndUpdate so it doesn't run the password validations
  // but run the other validations
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

// This function is to only allow logged in users
exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });
  // 204 no content
  res.status(204).json({
    status: 'success',
    data: null,
  });
});
