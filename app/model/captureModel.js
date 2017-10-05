const _ = require('lodash');

const promiseDb = require('../io/promiseDb');

/**
 * Loads a capture by ID.  Side-loads all location_id's associated with it.
 *
 * @param captureId
 * @returns Promise resolved with the capture record, or null if none found
 */
exports.getCaptureById = captureId => promiseDb
.then(db => db.getAsync('SELECT * FROM capture WHERE capture_id = $captureId', { $captureId: captureId }))
.then(results => results || null) // sqlite returns undefined if not found, make it null

// side-load location_ids
.then((capture) => {
  if (!capture) return capture;

  return promiseDb.then(db => db.allAsync(
    'SELECT location_id FROM capture_location WHERE capture_id = $capture_id',
    { $capture_id: capture.capture_id },
  ))
  .then((locations) => {
    capture.location_ids = (locations || []).map(l => l.location_id);
    return capture;
  });
});

/**
 * Creates a new capture record for a user
 * @param userId ID of user for which the capture capture is being created for
 * @returns The newly-inserted capture
 */
exports.createCapture = userId => promiseDb
.then(db => new Promise((resolve, reject) => {
  db.run(
    'INSERT INTO capture (user_id) VALUES ($userId)',
    { $userId: userId },
    function(error) {
      if (error) return reject(error);

      return resolve(this.lastID);
    },
  );
}))
.then(newId => exports.getCaptureById(newId));

/**
 * Updates attributes of a capture
 *
 * @param captureId Which capture to update
 * @param attrs Object like: {
 *   .mood_id: ID of mood to update
 *   .location_ids: Array of location ID's to configure
 * }
 */
exports.updateCapture = (captureId, attrs) => promiseDb
.then(db => new Promise((resolve, reject) => {
  db.beginTransaction(function(error, tDb) {
    if (error) {
      reject(error);
      return;
    }

    if (attrs.mood_id) {
      tDb.run(
        'UPDATE capture SET mood_id = $mood_id WHERE capture_id = $capture_id',
        { $mood_id: attrs.mood_id, $capture_id: captureId },
      );
    }

    if (attrs.location_ids) {
      tDb.serialize(() => {
        tDb.run(
          'DELETE FROM capture_location WHERE capture_id = $capture_id',
          { $capture_id: captureId },
        );
        let stmt = tDb.prepare('INSERT INTO capture_location (location_id, capture_id) VALUES (?, ?)');
        attrs.location_ids.forEach(locId => stmt.run([locId, captureId]));
        stmt.finalize();
      });
    }

    tDb.commit((error) => {
      if (error) return reject(error);
      return resolve(1);
    });
  });
}));

/**
 * Counts the number of mood captures for a user
 * @param userId
 * @returns Object where key is mood_id, value is number of times that mood appeared.
 *   Moods that were never captured for a user are not included.
 *   Moods not yet classified are keyed as 'unclassified'.
 */
exports.countMoodsByUserId = userId => promiseDb
.then(db => db.allAsync(
  'SELECT mood_id, count(*) AS count FROM capture WHERE user_id = $user_id GROUP BY mood_id',
  { $user_id: userId },
))
.then(results => _(results).keyBy(record => record.mood_id || 'unclassified').mapValues(r => r.count).value());
