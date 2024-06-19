const express = require('express');
const router = express.Router();
const bookingsController = require('../controllers/bookingsController');
const authController = require('../controllers/authController');

// all routes require authenticated users
router.use(authController.protect);

router.get('/checkout-session/:tourId', bookingsController.getCheckoutSession);

// CRUD routes are only available to admins and lead guides
router.use(authController.restrictTo('admin', 'lead-guide'));

router
  .route('/')
  .get(bookingsController.getBookings)
  .post(bookingsController.createBooking);

router
  .route('/:id')
  .get(bookingsController.getBooking)
  .delete(bookingsController.deleteBooking)
  .patch(bookingsController.updateBooking);

module.exports = router;
