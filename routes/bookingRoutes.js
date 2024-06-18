const express = require('express');
const router = express.Router();
const bookingsController = require('../controllers/bookingsController');
const authController = require('../controllers/authController');

router.get(
  '/checkout-session/:tourId',
  authController.protect,
  bookingsController.getCheckoutSession
);

module.exports = router;
