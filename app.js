require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { schedule } = require('node-cron');
const bodyParser = require('body-parser');
const livereload = require('livereload');
const path = require('path');
const session = require('express-session');
const dailyReport = require('./crons/dailyReporting');
const routes = require('./routes/router.js');

const app = express();




app.use(session({ secret: 'You can’t tell it anyone' }));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(cors());
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(routes());

schedule('15 7 * * *', () => {
  dailyReport.start();
});


const listener = app.listen(3000, () => {
  console.log(`Your app is listening on port ${listener.address().port}`);
});

const liveReloadServer = livereload.createServer({
  port: 8080, exts: ['js', 'ejs', 'css'],
});
liveReloadServer.watch(path.join(__dirname, 'public'));
liveReloadServer.watch(path.join(__dirname, 'views'));
