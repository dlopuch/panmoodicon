const _ = require('lodash');

const MAX_DURATION_MS = 1000;
const RANDOM_MOODS = ['happy', 'sad', 'neutral'];

exports.classifyMood = captureData => new Promise((resolve) => {
  setTimeout(() => resolve(_.sample(RANDOM_MOODS)), Math.random() * MAX_DURATION_MS);
});
