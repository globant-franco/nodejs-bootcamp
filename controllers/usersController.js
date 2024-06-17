const multer = require('multer'); // middleware for handling multipart/form-data
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const factory = require('./handlerFactory');
const sharp = require('sharp'); // image resizing

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

// folder where we're gonna save uploaded images
// if we don't set folder it will save images in memory
// const multerStorage = multer.diskStorage({
//   destination: (req, file, callbackFn) => {
//     // First argument is the error, if not set it to null
//     // Second argument is the destination
//     callbackFn(null, 'public/img/users');
//   },
//   // set how we're gonna name our file once uploaded
//   filename: (req, file, callbackFn) => {
//     //user-UserId-timestamp.jpeg
//     const extension = file.mimetype.split('/')[1];
//     callbackFn(null, `user-${req.user.id}-${Date.now()}.${extension}`);
//   },
// });

// Let's have the image stored as a buffer so we can do the resizing
// setting this allows us to have access to the image at req.file.buffer
const multerStorage = multer.memoryStorage();

// Here we check if the file is really an image, this callback is the same as the one
// we specify in the `destination` and `filename` options for the multerStorage
const multerFilter = (req, file, callbackFn) => {
  if (file.mimetype.startsWith('image')) {
    callbackFn(null, true);
  } else {
    callbackFn(
      new AppError('Not an image! Please upload only images.', 400),
      false
    );
  }
};

//const upload = multer({ dest: 'public/img/users' });
const upload = multer({ storage: multerStorage, fileFilter: multerFilter });

// single -> 'photo' is the name of the form field that holds the image upload
// it also will set the image file in the request object as req.file not req.body.file
exports.updateUserPhoto = upload.single('photo');

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  // Since image is in memory there's not a filename yet, let's override
  // the file object with the new filename to make it available to the
  // next middleware
  // let's also hardcode the format because we're implicitly converting
  // each image to jpeg
  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);

  next();
});

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
  if (req.file) allowedParams.photo = req.file.filename;

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
