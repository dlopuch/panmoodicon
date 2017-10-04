import router from 'express';

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
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

export default router;
