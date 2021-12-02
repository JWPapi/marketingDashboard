const fetch = require('node-fetch');
const express = require('express');

const socialBladeRouter = express.Router();

const opts = {
  headers: {
    Clientid: 'cli_e98ce1779e59fad96f84c392',
    History: 'default',
    Query: 'renelacad',
    Token: '9073c62c53817669c6ba4306d8efdd15aeb53017a6bf1f6b1562dbfb25549a0f3ea575ddc60a534281fa085fa780f6b57157128f5222616007d23b8a5030674e',
  },
};

socialBladeRouter.get('/youtube', (req, res, next) => {
  const getReneYoutube = async () => {
    const url = 'https://matrix.sbapis.com/b/youtube/statistics';
    const response = await fetch(url, opts);

    response.json().then((e) => res.send(e.data.daily));
  };

  getReneYoutube().catch(next);
});

socialBladeRouter.get('/tiktok', (req, res, next) => {
  const getReneTikTok = async () => {
    const url = 'https://matrix.sbapis.com/b/tiktok/statistics';
    const response = await fetch(url, opts);

    response.json().then((e) => res.send(e.data.daily));
  };

  getReneTikTok().catch(next);
});

module.exports = socialBladeRouter;
