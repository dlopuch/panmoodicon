# panmoodicon

Example API demo project stubbing out a "mood classification" service.

- RESTful API
- sqlite as persistent data store
- mocha for testing (unit & integration)
- Business tier with DI for mocking out components
- JWT for authorization and authentication

# Run Instructions

Requires **Node 8 or greater**!  See [nvm](https://github.com/creationix/nvm) or similar for easy environment upgrades.

1. `npm install`: Install dependencies
1. `npm run test`: Run unit test suite
1. `npm run test-integration`: Run integration test suite (hits API endpoints)
1. `npm run init-db`: Initializes new sqlite db (`app/sqlite.db`)
1. `npm run get-jwt`: Create an example JWT token.  Copy the string, you'll need to cURL your own requests
1. `npm run app-dev`: Starts up the app on `localhost:3000` for your own testing. Try some curl'ing.
1. OPTIONAL: `npm run app-prod`: Starts up the app in prod mode (no debug logging, etc.). 
Expects `JWT_ALG` and `JWT_SECRET` env vars to be set by deployment orchestration (you can fake it with `$ JWT_ALG=HS256 JWT_SECRET=shhhhhh npm run app-prod`)

## Linting (Code Style)
We're using `eslint` to enforce code style.  While developing, you can open up a terminal window
and run `npm run lint-dev` to have an updating lint watch server to remind you of all the commas
you forget with your sloppy js ; )

Using the airbnb javascript code style, with a couple overrides where strong opinions differ.

# API

You can use any HTTP request tool to hit the API (cURL, Postman, the integration tests, etc.)
Note that you need to supply a valid JWT Bearer token in the 'Authorization' header.
In prod, bearer tokens would be provided by master auth service.

For testing, there's a script to create a JWT for you (`npm run get-jwt`).  You can use the output like this:

```
$ npm run get-jwt
$ export JWT="Bearer d3ad.d3ad.b33333f"
$ curl -H "Authorization: $JWT" localhost:3000/api/...
```


## POST `/api/capture`

*Requires JSON body like `{ captureData: 'some mock image data' }`*

**Creates a new mood capture record and returns it.**  Mood and locations will
initially be empty as background services work to code these traits -- keep polling
for updates

Example request:

```
curl \
    -H "Authorization: $JWT" \
    -X POST \
    -H "Content-Type: application/json" \
    -d '{ "captureData": "mock image data" }' \
    localhost:3000/api/capture
```

Example response:

```javascript
{ capture_id: 14,
  user_id: 42,
  timestamp: '2017-10-05 20:51:23',
  mood_id: null,
  mood_timestamp: null,
  location_ids: [] }
```

## GET `/api/capture/:capture_id`

**Gets the capture record.**  Mood and location will be filled in when background services finish processing -- keep polling.

Example request:

```
curl -H "Authorization: $JWT" localhost:3000/api/capture/14
```

Example response:

```javascript
{ capture_id: 14,
  user_id: 42,
  timestamp: '2017-10-05 20:51:23',
  mood_id: 3,
  mood_timestamp: '2017-10-05 20:51:24',
  location_ids: [ 1, 3 ] }
```

Note that `mood_id` and `location_ids`, which were initially blank in the POST, are now filled in now that the background
jobs have completed


## GET `/api/mood`

**Gets counts of all user's captured moods.**

Example request (hint: try POST'ing a bunch of captures first):

```
curl -H "Authorization: $JWT" localhost:3000/api/mood
```

Example response:

```json
{
  "neutral": {
    "mood_id": "1",
    "count": 2
  },
  "sad": {
    "mood_id": "2",
    "count": 7
  },
  "happy": {
    "mood_id": "3",
    "count": 3
  }
}
```


## GET `/api/mood/:mood_id/locations`

**Gets most frequent locations tagged during a user's moods**

Example request (hint: try POST'ing a bunch of captures first):

```
curl -H "Authorization: $JWT" localhost:3000/api/mood/3/locations
```

Example response:

```json
{
  "a giant battery": {
    "location_id": "2",
    "count": 5
  },
  "park": {
    "location_id": "3",
    "count": 3
  },
  "dessert": {
    "location_id": "4",
    "count": 3
  },
  "desert": {
    "location_id": "6",
    "count": 2
  },
  "storage locker": {
    "location_id": "7",
    "count": 1
  }
}
```

# Overview and Discussion

- Persistence
    - sqlite DB
    - Schema defined in `scripts/initDb.js`
- Model Tier
    - Defines SQL queries to run against DB
    - Define model schema
- Business Tier
    - Dispatches to multiple model objects and combines results together
    - Business logic like "is user authorized to access an entity"
        - And if not, how to report it (see Logging)
    - Simple DI wrappers to define model and service dependencies
        - See mocks used in `test/business/`
    - Node async control flow can be a pain to uninitiated. However, it really shines when dispatching to "background jobs".
      See `business/captureBusiness#postNewCapture()` for promise branching that allow quick response while dispatching to
      background jobs while avoiding, eg thread pool complexity.
- API Tier
    - RESTful endpoints
    - MW just thin wrappers for business functions (business tier should be unaware of HTTP context!)
    - MW chain resolves various concerns -- authentication, logging, error reporting, etc.
- User Model and Authentication
    - All API requests require JWT keys
    - JWT secrets are read from env on bootup -- up to startup environment to supply them
    - JWT allows app to not concern itself about user management
        - Access allowed as long as trusted bearer token presented
    - *About JWT:* just signed claims, base-64 encoded.  eg take output of `npm run get-jwt` and [base-64 decode it](https://www.base64decode.org/)
- Logging
    - Endpoint timing example done using `morgan` -- see endpoint timing in console
        - Can be redirected to logging infrastructure, eg influxDB, ELK/Elastic, etc.
    - Global error handler logs all errors. Can also be directed to logging infrastructure.
- Testing
    - Unit Tests: `app/test/`
        - Business logic tests use mocks for models and services (hence, DI wrappers)
        - Model tests check functionality of database queries
            - TODO: Proper functional test suite would include something like a transactional wrapper for DB so tests could
              be stateless.  Discussion about example dataset -- worth it or not.
    - Integration Tests: `app/test-integration/`
        - Hit actual HTTP endpoints to check app flow end-to-end
        - Stateful by nature
