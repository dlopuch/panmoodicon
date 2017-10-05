/* eslint-env mocha */

const assert = require('assert');

const captureModel = require('../../model/captureModel');
const locationModel = require('../../model/locationModel');
const moodModel = require('../../model/moodModel');

describe('Capture Model', function() {
  it('completes Insert > Read integration test', function() {
    let USER_ID = 1;
    let newCaptureId;

    return captureModel.createCapture(USER_ID)
    .then((insertedRecord) => {
      assert.ok(insertedRecord, 'Result missing!');

      newCaptureId = insertedRecord.capture_id;
      assert.ok(newCaptureId, 'ID assigned');

      assert.strictEqual(insertedRecord.user_id, USER_ID, 'Wrong capture!');
    })

    .then(() => captureModel.getCaptureById(newCaptureId))
    .then((captureRecord) => {
      assert.ok(captureRecord, 'Result missing!');
      assert.strictEqual(captureRecord.capture_id, newCaptureId, 'Wrong/missing ID');
      assert.strictEqual(captureRecord.user_id, USER_ID, 'Wrong/missing user_id');
    });
  });

  describe('#updateCapture', function() {
    it('updates both mood and locations', function() {
      const USER_ID = 1;
      const testId = Math.random();

      let capture;
      let mood;
      let locations;
      let locationNames = [];

      for (let i = 0; i < 10; i += 1) {
        locationNames.push(`CaptureModel#updateCapture() ${testId} ${i}`);
      }

      return moodModel.insertMood(`Mood ${testId}`).then(newMood => (mood = newMood))
      .then(() => locationModel.getOrCreateLocationsByName(locationNames)).then(newLocations => (locations = newLocations))
      .then(() => captureModel.createCapture(USER_ID)).then(newCapture => (capture = newCapture))

      // Now do our update
      .then(() => captureModel.updateCapture(
        capture.capture_id,
        {
          mood_id: mood.mood_id,
          location_ids: locations.map(l => l.location_id),
        },
      ))
      .then((results) => {
        assert.equal(results, 1);
      })

      // Now read it back
      .then(() => captureModel.getCaptureById(capture.capture_id))
      .then((readCapture) => {
        assert.ok(readCapture, 'Missing capture!');
        assert.equal(readCapture.mood_id, mood.mood_id, 'Wrong mood!');
        assert.deepEqual(readCapture.location_ids, locations.map(l => l.location_id), 'Wrong location_ids!');
      });
    });
  });

  describe('#countMoodsByUserId', function() {
    it.only('counts correctly', function() {
      const USER_ID = 1;
      let mood1;
      let mood2;

      let createMoodyCapture = moodRecord =>
        captureModel.createCapture(USER_ID)
        .then(capture => captureModel.updateCapture(capture.capture_id, { mood_id: moodRecord.mood_id }));

      return moodModel.insertMood('mood1').then(newMood => (mood1 = newMood))
      .then(() => moodModel.insertMood('mood2')).then(newMood => (mood2 = newMood))
      .then(() => createMoodyCapture(mood1))
      .then(() => createMoodyCapture(mood2))
      .then(() => createMoodyCapture(mood2))

      // create an unclassified capture
      .then(() => captureModel.createCapture(USER_ID))

      .then(() => captureModel.countMoodsByUserId(USER_ID))
      .then((results) => {
        assert.ok(results, 'results missing');
        assert.deepEqual(
          results,
          {
            [mood1.mood_id]: 1,
            [mood2.mood_id]: 2,
            unclassified: 1,
          },
        );
      });
    });
  });
});
