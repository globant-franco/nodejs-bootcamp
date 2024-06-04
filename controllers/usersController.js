const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');

const filterObject = (obj, ...allowedFields) => {
  const filteredObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) {
      filteredObj[el] = obj[el];
    }
  });
  return filteredObj;
};

exports.getUsers = catchAsync(async (req, res) => {
  const users = await User.find();

  res.status(200).json({
    status: 'success',
    results: users.length,
    data: {
      users,
    },
  });
});

exports.createUser = (req, res) => {
  const newId = users[users.length - 1].id + 1;
  const newuser = Object.assign({ id: newId }, req.body);
  users.push(newuser);
  fs.writeFile(
    './dev-data/data/users-simple.json',
    JSON.stringify(users),
    (err) => {
      console.log('Error writing file in post request', err);
      res.status(201).json({
        status: 'success',
        data: {
          user: newuser,
        },
      });
    }
  );
};

exports.getUser = (req, res) => {
  const id = req.params.id * 1;
  const user = users.find((ele) => ele.id === id);

  if (!user) {
    return res.status(404).json({ status: 'fail', message: 'user not found' });
  }

  res.status(200).json({
    status: 'success',
    data: {
      user,
    },
  });
};

exports.deleteUser = (req, res) => {
  const id = req.params.id * 1;
  const user = users.find((ele) => ele.id === id);

  if (!user) {
    return res.status(404).json({ status: 'fail', message: 'user not found' });
  }

  res.status(204).json({
    status: 'success',
    data: null,
  });
};

exports.updateUser = (req, res) => {
  const id = req.params.id * 1;
  const user = users.find((ele) => ele.id === id);

  if (!user) {
    return res.status(404).json({ status: 'fail', message: 'user not found' });
  }

  res.status(200).json({
    status: 'success',
    data: {
      user: `<Updated user ${user.id} here...>`,
    },
  });
};

// This function is to only allow logged in user to update name and email
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

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });
  // 204 no content
  res.status(204).json({
    status: 'success',
    data: null,
  });
});
