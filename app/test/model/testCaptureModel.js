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
    it('counts correctly', function() {
      const USER_ID = 5413;
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

  describe('#countLocationFrequencyByMood', function() {
    it('counts correctly', function() {
      const USER_ID = 178431;
      let mood;
      let loc1;
      let loc2;
      let loc3;

      let createLocatedCapture = locations =>
        captureModel.createCapture(USER_ID)
        .then(capture => captureModel.updateCapture(capture.capture_id, {
          mood_id: mood.mood_id,
          location_ids: locations ? locations.map(l => l.location_id) : undefined,
        }));

      return moodModel.insertMood('#countLocationFrequencyByMood').then(newMood => (mood = newMood))
      .then(() => locationModel.insertLocation(`${USER_ID} 1`)).then(newLoc => (loc1 = newLoc))
      .then(() => locationModel.insertLocation(`${USER_ID} 2`)).then(newLoc => (loc2 = newLoc))
      .then(() => locationModel.insertLocation(`${USER_ID} 3`)).then(newLoc => (loc3 = newLoc))
      .then(() => createLocatedCapture([loc3]))
      .then(() => createLocatedCapture([loc3, loc2]))
      .then(() => createLocatedCapture([loc3, loc2, loc1]))

      // create an unlocated capture
      .then(() => createLocatedCapture())

      .then(() => captureModel.countLocationFrequencyByMood(USER_ID, mood.mood_id))
      .then((results) => {
        assert.ok(results, 'results missing');
        assert.deepEqual(
          results,
          {
            [loc1.location_id]: 1,
            [loc2.location_id]: 2,
            [loc3.location_id]: 3,
          },
        );
      });
    });
  });
});
