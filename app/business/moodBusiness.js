const _ = require('lodash');
const Promise = require('bluebird');

const UserError = require('./UserError');

// DI Wrapper
module.exports = (
  moodModel,
  captureModel,
  locationModel,
) => ({

  /**
   * Returns a map from mood description to a count of how many times that mood appears for a user
   * @param userId
   */
  getMoodFrequencies: userId =>
    new Promise((resolve, reject) => {
      if (typeof userId !== 'number') {
        return reject(new Error('Invalid or missing userId'));
      }
      return resolve();
    })
    .then(() => Promise.props({
      // retrieve in parallel:
      moodsById: moodModel.getMoodsIdx(),
      countsByMoodId: captureModel.countMoodsByUserId(userId),
    }))
    .then(data =>
      _(data.countsByMoodId)
      .mapValues((count, moodId) => ({ mood_id: Number.isNaN(parseInt(moodId, 10)) ? null : moodId, count }))
      .mapKeys((count, moodId) => data.moodsById[moodId] || moodId)
      .value(),
    ),

  getLocationCountsByMoodId: (userId, moodId) =>
    new Promise((resolve, reject) => {
      if (typeof userId !== 'number') {
        return reject(new Error('Invalid or missing userId'));
      }

      if (typeof moodId !== 'number') {
        return reject(new Error('Invalid or missing moodId'));
      }

      return resolve();
    })

    // Check to make sure specified moodId is valid
    .then(() => moodModel.getMoodById(moodId))
    .then((moodRecord) => {
      if (!moodRecord) {
        throw new UserError('Unknown or invalid moodId specified!');
      }

      // Mood is valid -- get the data (in parallel)
      return Promise.props({
        locationCountsByLocId: captureModel.countLocationFrequencyByMood(userId, moodId),
        locationsById: locationModel.getLocationsIdx(),
      });
    })
    .then(data =>
      _(data.locationCountsByLocId)
      .mapValues((count, locId) => ({ location_id: locId, count }))
      .mapKeys((count, locId) => data.locationsById[locId])
      .value(),
    ),

});
