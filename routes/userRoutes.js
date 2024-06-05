const express = require('express');
const router = express.Router(); // this is a middleware
const usersController = require('../controllers/usersController');
const authController = require('../controllers/authController');

router.post('/signup', authController.signup); // same as creating a new user
router.post('/login', authController.login);
router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);
router.patch(
  '/updatePassword',
  authController.protect,
  authController.updatePassword
);
// Remember that since the protect middleware is called, then user
// is set in the req.user object
router.patch('/updateMe', authController.protect, usersController.updateMe);
router.delete('/deleteMe', authController.protect, usersController.deleteMe);

router.route('/').get(usersController.getUsers);

router
  .route('/:id')
  .get(
    authController.protect,
    authController.restrictTo('admin', 'user'),
    usersController.getUser
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin'),
    usersController.deleteUser
  )
  .patch(
    authController.protect,
    authController.restrictTo('admin'),
    usersController.updateUser
  );

module.exports = router;
