const MAX_DURATION_MS = 1000;
const RANDOM_LOCATIONS = ['park', 'ocean', "a giant effin' battery", 'storage locker', 'desert', 'dessert', 'office tower'];

exports.classifyLocations = captureData => new Promise((resolve) => {
  setTimeout(
    () => {
      let locations = RANDOM_LOCATIONS.filter(l => Math.random() > 0.8);
      if (!locations.length) {
        locations = [RANDOM_LOCATIONS[0]]; // find at least one location
      }
      resolve(locations);
    },
    Math.random() * MAX_DURATION_MS,
  );
});
