const express = require('express');
const router = express.Router();
const viewsController = require('./../controllers/viewsController');

// Overview is the landing page
router.get('/', viewsController.getOverview);

router.get('/tour/:slug', viewsController.getTour);
router.get('/login', viewsController.getLogin);

module.exports = router;
