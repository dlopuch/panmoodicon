const jwt = require('../business/jwtBusiness');

console.log('JWT bearer string for userId: 42 (set this as your Authorization header):');
console.log(`\t${jwt.createAuthHeader(42)}`);
