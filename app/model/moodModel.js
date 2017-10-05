const _ = require('lodash');

const promiseDb = require('../io/promiseDb');

/**
 * @param moodId
 * @returns Promise resolved with the mood record, or null if none found
 */
exports.getMoodById = moodId => promiseDb
.then(db => db.getAsync('SELECT * FROM mood WHERE mood_id = $moodId', { $moodId: moodId }))
.then(results => results || null); // sqlite returns undefined if not found, make it null


exports.getOrCreateMoodByName = moodName => promiseDb
// Create mood if it doesn't exist
.then(db => db.runAsync(
  'INSERT OR IGNORE INTO mood (mood_desc) VALUES ($desc)',
  { $desc: moodName },
))
// Retrieve full record regardless of outcome
.then(() => promiseDb)
.then(db => db.getAsync(
  'SELECT * FROM mood WHERE mood_desc = $desc',
  { $desc: moodName },
));

/**
 * @returns Promise resolved with an index of all DB moods keyed by mood_id
 */
exports.getMoodsIdx = () => promiseDb
.then(db => db.allAsync('SELECT * FROM mood'))
.then(results => _.keyBy(results, 'mood_id')); // TODO: This could benefit from a caching layer

/**
 * Insert a new mood into the DB
 * @param moodDesc Mood description/name
 * @returns The newly-inserted mood record
 */
exports.insertMood = moodDesc => promiseDb
.then(db => new Promise((resolve, reject) => {
  db.run(
    'INSERT INTO mood (mood_desc) VALUES ($desc)',
    { $desc: moodDesc },
    function(error) {
      if (error) return reject(error);

      return resolve(this.lastID);
    },
  );
}))
.then(newId => exports.getMoodById(newId));
