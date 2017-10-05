/* eslint-env mocha */

const assert = require('assert');

const moodBusinessDI = require('../../business/moodBusiness');

describe('moodBusiness.js', function() {
  describe('#getMoodFrequencies()', function() {
    it('combines moodModel and captureModel data appropriately', () => {
      let moodBusiness = moodBusinessDI(
        // moodModel mock:
        {
          getMoodsIdx: () => new Promise(resolve => resolve(
            { 11: 'mood 11', 22: 'mood 22' },
          )),
        },

        // captureModel mock:
        {
          countMoodsByUserId: userId => new Promise(resolve => resolve(
            { 11: 1, 22: 2, unclassified: 3 },
          )),
        },
      );

      return moodBusiness.getMoodFrequencies(99)
      .then(results => assert.deepEqual(results, {
        'mood 11': { mood_id: 11, count: 1 },
        'mood 22': { mood_id: 22, count: 2 },
        unclassified: { mood_id: null, count: 3 },
      }));
    });
  });

  describe('#getLocationCountsByMoodId()', function() {
    it('combines moodModel and captureModel data appropriately', () => {
      let moodBusiness = moodBusinessDI(
        // moodModel mock:
        { getMoodById: () => new Promise(resolve => resolve({ mood_id: 1 })) },

        // captureModel mock:
        {
          countLocationFrequencyByMood: (userId, moodId) => new Promise(resolve => resolve(
            { 11: 1, 22: 2, 33: 3 },
          )),
        },

        // locationModel mock:
        {
          getLocationsIdx: () => new Promise(resolve => resolve({
            11: 'loc 11',
            22: 'loc 22',
            33: 'loc 33',
          })),
        },
      );

      return moodBusiness.getLocationCountsByMoodId(99, 1)
      .then(results => assert.deepEqual(results, {
        'loc 11': { location_id: 11, count: 1 },
        'loc 22': { location_id: 22, count: 2 },
        'loc 33': { location_id: 33, count: 3 },
      }));
    });
  });
});
