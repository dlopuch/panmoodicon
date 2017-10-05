/* eslint-env mocha */

const assert = require('assert');
const Promise = require('bluebird');

const locationModel = require('../../model/locationModel');
const moodModel = require('../../model/moodModel');
const captureModel = require('../../model/captureModel');

const captureBusinessDI = require('../../business/captureBusiness');

describe('captureBusiness.js', function() {
  describe('#postNewCapture', function() {
    it('posts and completes background jobs, updating DB in order', () => {
      const MOOD = 'happy';
      const LOCATIONS = ['supermarket', 'park', 'storage-locker'];

      // Aliases for mocks' Promises' resolve() functions -- remote controls to control when background processing finishes
      let completeCaptureService;
      let completeLocationService;

      let captureBusiness = captureBusinessDI(
        moodModel, captureModel, locationModel,

        // mock captureService
        {
          classifyMood: data => new Promise((resolve) => {
            completeCaptureService = () => resolve(MOOD);
          }),
        },

        // mock locationService
        {
          classifyLocations: data => new Promise((resolve) => {
            completeLocationService = () => resolve(LOCATIONS);
          }),
        },
      );


      // Now lets do some stuff!
      let promisePost = captureBusiness.postNewCapture(98431, 'some mock jpeg stream');

      let promisePostResult;

      return promisePost
      .then((newCapture) => {
        assert.ok(newCapture, 'missing capture');
        assert.ok(newCapture.capture_id, 'missing id');
        promisePostResult = newCapture;
      })

      // make sure it's persisted
      .then(() => captureModel.getCaptureById(promisePostResult.capture_id))
      .then((readCapture) => {
        assert.ok(readCapture, 'not persisted!');
        assert.deepEqual(readCapture, promisePostResult, 'read capture not equal to posted capture!');
        assert.equal(readCapture.mood_id, null, 'Expected no mood yet!');
        assert.deepEqual(readCapture.location_ids, [], 'Expected no IDs yet');


        // Great.  Next step is to make sure the mood classification works.
        // Unblock the background task:
        completeCaptureService();

        // ...then make these tests wait for the mood classification chain to finish
        return promisePost.promiseMoodClassification;
      })

      // Re-read the capture and load mood
      .then(() => Promise.props({
        readCapture: captureModel.getCaptureById(promisePostResult.capture_id),
        mood: moodModel.getOrCreateMoodByName(MOOD),
      }))
      .then((data) => {
        assert.equal(data.readCapture.mood_id, data.mood.mood_id, 'Mood not persisted in capture');
        assert.deepEqual(data.readCapture.location_ids, [], 'Locations still expected to be empty');


        // Great.  Next step is to make sure the location classification works.
        // Unblock the background task:
        completeLocationService();

        // ...then make these tests wait for the location classification chain to finish
        return promisePost.promiseLocationClassification;
      })

      // Re-read the capture and load locations
      .then(() => Promise.props({
        readCapture: captureModel.getCaptureById(promisePostResult.capture_id),
        mood: moodModel.getOrCreateMoodByName(MOOD),
        locations: locationModel.getOrCreateLocationsByName(LOCATIONS),
      }))
      .then((data) => {
        assert.equal(data.readCapture.mood_id, data.mood.mood_id, 'Mood not persisted in capture');
        assert.deepEqual(data.readCapture.location_ids, data.locations.map(l => l.location_id), 'Invalid locations');

        // success!
      });
    });
  });
});
