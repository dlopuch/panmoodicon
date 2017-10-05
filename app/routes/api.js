const express = require('express');
const UserError = require('../business/UserError');

// DI wrapper
module.exports = (
  captureBusiness,
  moodBusiness,
  jwtBusiness,
) => {
  const router = express.Router();

  /**
   * JWT authorization MW.  Extracts the JWT payload, expecting a valid user_id to be set.
   * MW sets the JWT payload under the req.user object.  See the getUserId(req) function below.
   */
  router.use(function(req, res, next) {
    let authHeader = req.get('Authorization');
    let tokenMatcher = /Bearer (.*)/g;

    let matches = tokenMatcher.exec(authHeader);

    let promiseVerification;
    if (!matches) {
      promiseVerification = jwtBusiness.verify(null); // will with appropriate error
    } else {
      promiseVerification = jwtBusiness.verify(matches[1]);
    }

    promiseVerification
    .then((decoded) => {
      if (!decoded.user_id) {
        let e = new Error('Unexpected JWT -- JWT valid, but missing user_id in payload');
        e.jwtPayload = decoded;
        next(e);
        return;
      }

      req.user = decoded;
      next();
    })
    .catch(err => next(err));
  });

  /**
   * Helper function to extract standard JWT-supplied user-id from a request
   * @param req
   */
  function getUserId(req) {
    return req.user.user_id;
  }

  router.post('/capture', function(req, res, next) {
    captureBusiness.postNewCapture(getUserId(req), req.body.captureData)
    .then(captureRecord => res.json(captureRecord))
    .catch(err => next(err));
  });

  router.get('/capture/:capture_id', (req, res, next) => {
    captureBusiness.getCaptureById(getUserId(req), req.params.capture_id)
    .then(record => res.json(record))
    .catch(err => next(err));
  });

  router.get('/mood', function(req, res, next) {
    moodBusiness.getMoodFrequencies(getUserId(req))
    .then(data => res.json(data))
    .catch(err => next(err));
  });

  router.get('/mood/:mood_id/locations', function(req, res, next) {
    moodBusiness.getLocationCountsByMoodId(getUserId(req), req.params.mood_id, 10)
    .then(data => res.json(data))
    .catch(err => next(err));
  });

  // catch 404 and forward to error handler
  router.use(function(req, res, next) {
    let err = new UserError('Not Found');
    err.status = 404;
    next(err);
  });

  // API JSON error handler
  router.use(function(err, req, res, next) {
    let errData = {
      error: err.userMessage || 'Unexpected Error',
      status: err.status || 500,
    };

    // Add additional data only if in development/test mode
    if (req.app.get('env') === 'development' || req.app.get('env') === 'test') {
      errData.moreInfo = {
        message: err.message,
        stack: err.stack,
        fullError: err, // for extra attributes stacked on it
      };
    }

    res.status(errData.status);
    res.json(errData);

    // Continue on to error mw chain, eg logging
    next(err);
  });

  return router;
};
