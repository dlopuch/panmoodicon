/* eslint-env mocha */

const assert = require('assert');

const moodModel = require('../../model/moodModel');

describe('Mood Model', function() {
  it('completes Insert > Read > Index integration test', function() {
    let MOOD_NAME = 'test mood';
    let newMoodId;

    return moodModel.insertMood(MOOD_NAME)
    .then((insertedRecord) => {
      assert.ok(insertedRecord, 'Result missing!');

      newMoodId = insertedRecord.mood_id;
      assert.ok(newMoodId, 'ID assigned');

      assert.strictEqual(insertedRecord.mood_desc, MOOD_NAME, 'Wrong mood!');
    })

    .then(() => moodModel.getMoodById(newMoodId))
    .then((moodRecord) => {
      assert.ok(moodRecord, 'Result missing!');
      assert.strictEqual(moodRecord.mood_id, newMoodId, 'Wrong/missing ID');
      assert.strictEqual(moodRecord.mood_desc, MOOD_NAME, 'Wrong/missing mood description');
    })

    .then(() => moodModel.getMoodsIdx())
    .then((moodsIdx) => {
      assert.ok(moodsIdx, 'Result missing!');
      assert.ok(moodsIdx[newMoodId], 'Newly created mood is missing from index!');
      assert.strictEqual(moodsIdx[newMoodId].mood_id, newMoodId, 'Indexed record incorrect');
    });
  });
});
