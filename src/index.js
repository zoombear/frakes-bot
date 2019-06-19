'use strict';
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const qs = require('qs');
const app = express();

const quotes = require('./quotes');

const apiUrl = 'https://slack.com/api';

const rawBodyBuffer = (req, res, buf, encoding) => {
  if (buf && buf.length) {
    req.rawBody = buf.toString(encoding || 'utf8');
  }
};

app.use(bodyParser.urlencoded({verify: rawBodyBuffer, extended: true }));
app.use(bodyParser.json({ verify: rawBodyBuffer }));

app.use(express.static(__dirname + '/../')); // html
app.use(express.static(__dirname + '/../public')); // images

// Static Web UI
app.get('/', (req, res) => {
  res.sendFile('index.html');
});

const server = app.listen(3000, () => {
  console.log('Express server listening on port %d in %s mode', server.address().port, app.settings.env);});


app.post('/', (req, res) => {
  const frakes_quote = quotes[Math.floor(Math.random() * quotes.length)];
  const image_number = Math.floor(Math.random() * 9) + 1

  if(!frakes_quote) {
    res.send('Do you believe in the power of a curse?');
    return;
  }

  let data = {
    response_type: 'in_channel', // public to the channel
    text: frakes_quote,
    attachments:[
      {
        image_url: `https://frakes.s3-us-west-2.amazonaws.com/frakes-bot/${image_number}.jpg`
      }
    ]
  };
  res.json(data);
});

app.get('/slack', (req, res) => {
  if (!req.query.code) { // access denied
    res.redirect('/?error=access_denied');
    return;
  }
  const authInfo = {
    client_id: process.env.SLACK_CLIENT_ID,
    client_secret: process.env.SLACK_CLIENT_SECRET,
    code: req.query.code
  };

  axios.post(`${apiUrl}/oauth.access`, qs.stringify(authInfo))
    .then((result) => {
      // The payload data has been modified since the last version!
      // See https://api.slack.com/methods/oauth.access

      console.log(result.data);

      const { access_token, refresh_token, expires_in, error } = result.data;

      if(error) {
        res.sendStatus(401);
        console.log(error);
        return;
      }

    }).catch((err) => {
      console.error(err);
    });

});
