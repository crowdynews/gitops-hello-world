'use strict';

const express = require('express');

const { API_PORT = 8888, API_HOST = '0.0.0.0' } = process.env;

const app = express();

app.get('/', function helloWorld(req, res) {
  res.jsonp({
    text: 'Hello World GitOps!!!!'
  });
});

app.use(function notFound(req, res) {
  res.status(404).jsonp({
    error: 'Not Found'
  });
});

// prettier-ignore
app.use(function handleErrors(err, req, res, next) { // eslint-disable-line no-unused-vars
  res.status(500).jsonp({
    error: err.message || 'Internal Server Error'
  });
});

app.listen(API_PORT, API_HOST, () => {
  console.log(`The server is running on http://${API_HOST}:${API_PORT}/`);
});
