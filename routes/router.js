const express = require('express');

const router = express.Router();
const fbApi = require('./api/facebook');
const analyticsApi = require('./api/analytics');
//const tiktokAdsApi = require('./api/tiktokAds');
const socialBladeApi = require('./api/socialBlade');
// server.js
const wcApi = require('./api/woocommerce');
const indexController = require('../controller/indexController');

module.exports = () => {
  /* Viewable Pages */
  router.get('/', indexController(dependencies));

  /* APIs */
  router.get('/api/facebook/', fbApi);
  router.use('/api/analytics/', analyticsApi);
  //router.use('/api/tiktokAds/', tiktokAdsApi);
  router.get('/api/woocommerce/', wcApi);
  router.use('/api/socialBlade/', socialBladeApi);

  return router;
};
