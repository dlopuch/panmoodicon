const Promise = require('bluebird');

const UserError = require('./UserError');
const NotFoundError = require('./NotFoundError');

// DI Wrapper
module.exports = (
  moodModel,
  captureModel,
  locationModel,
  captureService,
  locationService,
) => ({

  getCaptureById: (userId, captureId) =>
    captureModel.getCaptureById(captureId)
    .then((capture) => {
      if (!capture) {
        return Promise.reject(new NotFoundError('No capture found', 'No capture with that ID in DB'));
      }

      if (capture.user_id !== userId) {
        return Promise.reject(new NotFoundError('No capture found', 'Capture actually found but wrong user'));
      }

      return capture;
    }),

  /**
   * Creates a new mood capture and initiates mood and location classification.
   *
   * We return as soon as there is a record of the capture in our DB.  Mood and location classification will be
   * background jobs -- user should poll the returned capture record for status updates.
   *
   * TESTING:
   * The returned promise has two promises attached: promiseMoodClassification and promiseLocationClassification.
   * These can be used to test completion of the background tasks.
   *
   * @param userId
   * @param captureData
   * @return {Promise} gets resolved with the persisted capture record
   */
  postNewCapture: (userId, captureData) => {
    if (!captureData) {
      return Promise.reject(new UserError('No data provided!'));
    }

    // Going to return back to the user as soon as the capture data is recorded in DB.
    // Background services can do their thing in the background meanwhile.
    let capture;
    let promiseCreation = captureModel.createCapture(userId)
    .then(newCapture => (capture = newCapture));


    // TODO: This is a simple in-process background worker branch-point.  Iteration 2 should use a persistent store
    //   to define jobs with a failure-resistant worker queue.  ie if server crashes, this data is lost.
    //   For this iteration: we return the main promise so API can respond, but in background, working on other services

    let promiseMoodClassification = promiseCreation
    .then(() => captureService.classifyMood(captureData))
    .then(moodName => moodModel.getOrCreateMoodByName(moodName))
    .then(moodRecord => captureModel.updateCapture(capture.capture_id, {
      mood_id: moodRecord.mood_id,
    }));

    let promiseLocationClassification = promiseCreation
    .then(() => locationService.classifyLocations(captureData))
    .then(locationNames => locationModel.getOrCreateLocationsByName(locationNames))
    .then(locationRecords => captureModel.updateCapture(capture.capture_id, {
      location_ids: locationRecords.map(l => l.location_id),
    }));


    // For testing purposes, inject the mood and location classification background jobs onto the returned promise
    promiseCreation.promiseMoodClassification = promiseMoodClassification;
    promiseCreation.promiseLocationClassification = promiseLocationClassification;

    return promiseCreation;
  },
});
