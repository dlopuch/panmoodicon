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

// error handler
app.use(function(err, req, res, next) {
  // TODO: Catch all errors here and send to logging infrastructure
  console.warn('ERROR serving route: ', err.stack);
});

app.listen(3000, () => console.log('Panmoodicon listening on localhost:3000'));

module.exports = app;
