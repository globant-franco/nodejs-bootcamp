const express = require('express');
const router = express.Router(); // this is a middleware
const usersController = require('../controllers/usersController');
const authController = require('../controllers/authController');

// Routes that don't require authentication
router.post('/signup', authController.signup); // same as creating a new user
router.post('/login', authController.login);
router.get('/logout', authController.logout);
router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);
router.patch(
  '/updatePassword',
  authController.protect,
  authController.updatePassword
);

// Routes that require authentication
// this is one way to protect all routes that come after this line
// nevertheless I prefer to explicitly call the protect method on each route
// in case someone moves the code around and don't protect the routes
//router.use(authController.protect);

// Remember that since the protect middleware is called, then user
// is set in the req.user object

router.patch(
  '/updateMe',
  authController.protect,
  usersController.updateUserPhoto,
  usersController.updateMe
);
router.delete('/deleteMe', authController.protect, usersController.deleteMe);
router.get(
  '/me',
  authController.protect,
  usersController.getMe,
  usersController.getUser
);

// for the purpose of this exercise let's add this middleware to all
// these protected routes only accessible by admins
router.use(authController.protect, authController.restrictTo('admin'));

router
  .route('/')
  .get(usersController.getUsers)
  .post(usersController.createUser);

router
  .route('/:id')
  .get(usersController.getUser)
  .delete(usersController.deleteUser)
  .patch(usersController.updateUser);

module.exports = router;
