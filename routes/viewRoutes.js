const express = require('express');
const router = express.Router();
const viewsController = require('./../controllers/viewsController');
const authController = require('./../controllers/authController');

// Set or not set user based on jwt cookie for all these routes
router.use(authController.isLoggedIn);

// Overview is the landing page
router.get('/', viewsController.getOverview);

router.get('/tour/:slug', viewsController.getTour);
router.get('/login', viewsController.getLogin);

module.exports = router;
