const express = require('express');

// DI wrapper
module.exports = (
  captureBusiness,
  moodBusiness,
) => {
  const router = express.Router();
  const FAKE_USER_ID = 4;

  router.post('/capture', function(req, res, next) {
    captureBusiness.postNewCapture(FAKE_USER_ID, req.body.captureData)
    .then(captureRecord => res.json(captureRecord))
    .catch(err => next(err));
  });

  router.get('/capture/:capture_id', (req, res, next) => {
    captureBusiness.getCaptureById(FAKE_USER_ID, req.params.capture_id)
    .then(record => res.json(record))
    .catch(err => next(err));
  });

  router.get('/mood', function(req, res, next) {
    moodBusiness.getMoodFrequencies(FAKE_USER_ID)
    .then(data => res.json(data))
    .catch(err => next(err));
  });

  router.get('/mood/:mood_id/locations', function(req, res, next) {
    moodBusiness.getLocationCountsByMoodId(FAKE_USER_ID, req.params.mood_id)
    .then(data => res.json(data))
    .catch(err => next(err));
  });

  // catch 404 and forward to error handler
  router.use(function(req, res, next) {
    let err = new Error('Not Found');
    err.status = 404;
    next(err);
  });

  // API JSON error handler
  router.use(function(err, req, res, next) {
    let errData = {
      error: err.userMessage || 'Unexpected Error',
      status: err.status || 500,
    };

    // Add additional data only if in development mode
    if (req.app.get('env') === 'development') {
      errData.moreInfo = {
        message: err.message,
        stack: err.stack,
      };
    }

    res.status(errData.status);
    res.json(errData);

    // Continue on to error mw chain, eg logging
    next(err);
  });

  return router;
};
