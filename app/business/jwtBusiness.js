const jwt = require('jsonwebtoken');
const Promise = require('bluebird');

const UserError = require('./UserError');

Promise.promisifyAll(jwt);

// Load JWT configuration from env vars
// TODO: Normally this would come from a secret store since env vars can be a bit risky.  Ideally a pem key.
const { JWT_ALG, JWT_SECRET } = process.env;

// Common configuration gotcha: disallow 'none' algorithm
if (!JWT_ALG || JWT_ALG === 'none') {
  throw new Error("JWT_ALG not specified or 'none' -- refusing to startup.");
}

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET missing -- refusing to startup.');
}

/**
 * Validates a jwtObject according to security config.
 * @param jwtObject
 * @returns Promise resolved with the decoded object, or fails with a UserError
 */
exports.verify = (jwtObject) => {
  if (!jwtObject) {
    let e = new UserError('Missing authorization, please include JWT');
    e.status = 401;
    return Promise.reject(e);
  }

  return jwt.verifyAsync(
    jwtObject, JWT_SECRET,
    {
      algorithms: [JWT_ALG],
      // TODO: maxAge, ignoreExpiration, clockTimestamp etc. as security policies dictate
    },
  )
  .catch((jwtError) => {
    let e;
    if (jwtError.name === 'TokenExpiredError') {
      e = new UserError('Authorization expired, please request new JWT');
    } else if (jwtError.name === 'JsonWebTokenError') {
      e = new UserError(`Not Authorized: ${jwtError.message}`);
    } else {
      e = new UserError('Not Authorized', 'JWT token fails authorization, see nested error object');
    }
    e.status = 401;
    e.jwtError = jwtError;
    return Promise.reject(e);
  });
};

/**
 * Creates example JWT token specifying authorization payload of { user_id: x }
 * Used for testing JWT -- NODE_ENV must be set to 'development' or 'test'.  Not available in prod.
 *
 * @param userId User ID to specify in auth token
 * @return {String} 'Authorization' header string, ie 'Bearer <jwt base64>'
 */
exports.createAuthHeader = (userId) => {
  if (process.env.NODE_ENV !== 'development' && process.env.NODE_ENV !== 'test') {
    throw new Error('Creating JWTs only available in dev or test env.  Set NODE_ENV=test. This is for your own good.');
  }

  return `Bearer ${jwt.sign({ user_id: userId }, JWT_SECRET, { algorithm: JWT_ALG })}`;
};
