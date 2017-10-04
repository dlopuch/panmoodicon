/* eslint-env mocha */

const assert = require('assert');

const locationModel = require('../../model/locationModel');

describe('Location Model', function() {
  it('completes Insert > Read > Index integration test', function() {
    let MOOD_NAME = 'test location';
    let newLocationId;

    return locationModel.insertLocation(MOOD_NAME)
    .then((insertedRecord) => {
      assert.ok(insertedRecord, 'Result missing!');

      newLocationId = insertedRecord.location_id;
      assert.ok(newLocationId, 'ID assigned');

      assert.strictEqual(insertedRecord.location_desc, MOOD_NAME, 'Wrong location!');
    })

    .then(() => locationModel.getLocationById(newLocationId))
    .then((locationRecord) => {
      assert.ok(locationRecord, 'Result missing!');
      assert.strictEqual(locationRecord.location_id, newLocationId, 'Wrong/missing ID');
      assert.strictEqual(locationRecord.location_desc, MOOD_NAME, 'Wrong/missing location description');
    })

    .then(() => locationModel.getLocationsIdx())
    .then((locationsIdx) => {
      assert.ok(locationsIdx, 'Result missing!');
      assert.ok(locationsIdx[newLocationId], 'Newly created location is missing from index!');
      assert.strictEqual(locationsIdx[newLocationId].location_id, newLocationId, 'Indexed record incorrect');
    });
  });

  it("gets a list of locations, optionally creating them if they don't exist", function() {
    let id = Math.random();
    let locations = [];
    for (let i = 0; i < 10; i += 1) {
      locations.push(`Loc-${id} #${i}`);
    }

    return locationModel.insertLocation(locations[0])
    .then(() => locationModel.getOrCreateLocationsByName(locations))
    .then((locations) => {
      assert.equal(locations.length, 10, 'Wrong number of locations!');
    });
  });
});
