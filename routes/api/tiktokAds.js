const fetch = require('node-fetch');
const { DateTime } = require('luxon');
const express = require('express');

const tiktokAdsRouter = express.Router();
const url = 'https://ads.tiktok.com/open_api/v1.1/reports/integrated/get/?';

const standardParams = {
  advertiser_id: '6851273279479480325', data_level: 'AUCTION_ADVERTISER', metrics: '["complete_payment", "spend"]', report_type: 'BASIC', dimensions: '["advertiser_id"]',
};

const { TIKTOKADS_TOKEN: accessToken } = process.env;
const opts = {
  headers: {
    'Access-Token': accessToken,
  },
  method: 'GET',
};

const getParams = (startDate, endDate) => new URLSearchParams({
  ...standardParams,
  start_date: startDate,
  end_date: endDate || startDate,
}).toString();

const getFetch = (startDate, endDate) => fetch(url + getParams(startDate, endDate), opts);

tiktokAdsRouter.get('/', (req, res, next) => {
  const getTikTokAdsData = async () => {
    const today = DateTime.local().setZone('America/Los_Angeles').toISODate();
    const yesterday = DateTime.local().setZone('America/Los_Angeles').minus({ days: 1 }).toISODate();
    const startOfMth = DateTime.local().setZone('America/Los_Angeles').startOf('month').toISODate();
    const startOfLastMth = DateTime.local().setZone('America/Los_Angeles').minus({ month: 1 }).startOf('month')
      .toISODate();
    const endOfLastMth = DateTime.local().setZone('America/Los_Angeles').minus({ month: 1 }).endOf('month')
      .toISODate();
    const timeFrames = [[today], [yesterday], [startOfMth, today], [startOfLastMth, endOfLastMth]];

    const fetches = timeFrames.map((e) => getFetch(...e));

    const data = await Promise.all(fetches);
    const response = await Promise.all(data.map((e) => e.json()));
    res.send(response.map((e) => e.data.list[0].metrics));
  };

  getTikTokAdsData().catch(next);
});

module.exports = tiktokAdsRouter;
