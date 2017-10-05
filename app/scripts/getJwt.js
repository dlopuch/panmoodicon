const jwt = require('../business/jwtBusiness');

let jwtBearer = jwt.createAuthHeader(42);
console.log('JWT bearer string for userId: 42 current env secrets. Set this as your Authorization header:');
console.log(`\t${jwtBearer}`);
console.log('\nConsider adding it as an env var for testing, eg:');
console.log(`\t$ export JWT="${jwtBearer}"`);
