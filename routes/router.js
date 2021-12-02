const express = require('express');

const router = express.Router();
const fbApi = require('./api/facebook');
const analyticsApi = require('./api/analytics');
const socialBladeApi = require('./api/socialBlade');
const wcApi = require('./api/woocommerce');
const indexController = require('../controller/indexController');

module.exports = () => {
  /* Viewable Pages */
  router.get('/', indexController());

  /* APIs */
  router.get('/api/facebook/', fbApi);
  router.use('/api/analytics/', analyticsApi);
  router.get('/api/woocommerce/', wcApi);
  router.use('/api/socialBlade/', socialBladeApi);

  return router;
};
