const express = require('express');
const router = express.Router();
const viewsController = require('./../controllers/viewsController');
const authController = require('./../controllers/authController');
const bookingsController = require('./../controllers/bookingsController');

// Set or not set user based on jwt cookie for all these routes
// router.use(authController.isLoggedIn);

// Overview is the landing page
router.get(
  '/',
  bookingsController.createBookingCheckout,
  authController.isLoggedIn,
  viewsController.getOverview
);

router.get('/tour/:slug', authController.isLoggedIn, viewsController.getTour);
router.get('/login', authController.isLoggedIn, viewsController.getLogin);
router.get('/me', authController.protect, viewsController.getAccount);
router.post(
  '/submit-user-data',
  authController.protect,
  viewsController.updateUserData
);
router.get('/my-tours', authController.protect, viewsController.getMyTours);

module.exports = router;
