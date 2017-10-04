const _ = require('lodash');
const Promise = require('bluebird');

const promiseDb = require('../io/promiseDb');

/**
 * @param locationId
 * @returns Promise resolved with the location record, or null if none found
 */
exports.getLocationById = locationId => promiseDb
.then(db => db.getAsync('SELECT * FROM location WHERE location_id = $locationId', { $locationId: locationId }))
.then(results => results || null); // sqlite returns undefined if not found, make it null

/**
 * @returns Promise resolved with an index of all DB locations keyed by location_id
 */
exports.getLocationsIdx = () => promiseDb
.then(db => db.allAsync('SELECT * FROM location'))
.then(results => _.keyBy(results, 'location_id')); // TODO: This could benefit from a caching layer

exports.getOrCreateLocationsByName = locationNames => promiseDb
// Create locations that may or may not exist
.then(db => new Promise((resolve, reject) => {
  db.serialize(function() {
    let stmt = db.prepare('INSERT OR IGNORE INTO location (location_desc) VALUES (?)');

    locationNames.forEach(locationName => stmt.run(locationName));
    stmt.finalize(() => resolve());
  });
}))
// Retrieve full location records with ID's
.then(() => promiseDb)
.then(db => db.allAsync(
  `SELECT * FROM location WHERE location_desc IN (${locationNames.map(n => '?')})`,
  locationNames,
));

/**
 * Insert a new location into the DB
 * @param locationDesc Location description/name
 * @returns The newly-inserted location record
 */
exports.insertLocation = locationDesc => promiseDb
.then(db => new Promise((resolve, reject) => {
  db.run(
    'INSERT INTO location (location_desc) VALUES ($desc)',
    { $desc: locationDesc },
    function(error) {
      if (error) return reject(error);

      return resolve(this.lastID);
    },
  );
}))
.then(newId => exports.getLocationById(newId));
