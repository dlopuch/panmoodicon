/* eslint-env mocha */

const assert = require('assert');

const moodModel = require('../../model/moodModel');

describe('Mood Model', function() {
  describe('#getOrCreateMoodByName', function() {
    it('handles multiple inserts', () => {
      let firstInsert;

      return moodModel.getOrCreateMoodByName('multi-create mood')
      .then(dbMood => (firstInsert = dbMood))
      .then(() => moodModel.getOrCreateMoodByName('multi-create mood'))
      .then((dbMood) => {
        assert.ok(dbMood);
        assert.ok(firstInsert);

        assert.ok(firstInsert.mood_id);

        assert.deepEqual(dbMood, firstInsert, 'Expected same mood record');
      });
    });
  });
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
