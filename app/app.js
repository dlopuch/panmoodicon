const express = require('express');
const path = require('path');
const logger = require('morgan');
const bodyParser = require('body-parser');

const applicationContext = require('./applicationContext');

const app = express();


app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));


app.use('/api', applicationContext.routes.api);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  let err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// Global error handler: hook for logging infrastructure
app.use(function(err, req, res, next) {
  // TODO: Catch all errors here and send to logging infrastructure
  if (err.status < 500) {
    // User-errors often noise -- just log with a warning
    console.warn('[LOGGING INFRASTRUCTURE] user-error on route: ', err.stack);
  } else {
    console.error('[LOGGING INFRASTRUCTURE] internal error on route: ', err.stack);
  }
});

module.exports = app;
