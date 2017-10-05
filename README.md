# panmoodicon

Full-stack demo project stubbing out a mood classification service.

- RESTful API
- sqlite as persistent data store
- mocha for testing (unit & integration)
- Business tier with DI for mocking out components
- JWT for authorization

# Run Instructions

1. `npm install`: Install dependencies
1. `npm run test`: Run unit test suite
1. `npm run test-integration`: Run integration test suite (hits API endpoints)
1. `npm run init-db`: Initializes new sqlite db (`app/sqlite.db`)
1. `npm run get-jwt`: Create an example JWT token.  Copy the string, you'll need to cURL your own requests
1. `npm run app-dev`: Starts up the app on `localhost:3000` for your own testing. Try some curl'ing.
1. OPTIONAL: `npm run app-prod`: Starts up the app in prod mode (no debug logging, etc.). 
Expects `JWT_ALG` and `JWT_SECRET` env vars to be set by deployment orchestration (you can fake it with `$ JWT_ALG=HS256 JWT_SECRET=shhhhhh npm run app-prod`)

# API

You can use any HTTP request tool to hit the API (cURL, Postman, the integration tests, etc.)
Note that you need to supply a valid JWT Bearer token in the 'Authorization' header.
In prod, bearer tokens would be provided by master auth service.  For testing, there's a script
to create one for you (`npm run get-jwt`).  You can use the output like this:

```
$ curl -H "Authorization: Bearer d3ad.b33f.b33333f" localhost:3000/api/...
```


## POST `/api/capture`
*Requires JSON body like `{ captureData: 'some mock image data' }`*

Creates a new mood capture record and returns it.  Mood and locations will
initially be empty as background services work to code these traits -- keep polling
for updates

## GET `/api/capture/:capture_id`
Gets the capture record.  Mood and location will eventually get filled in.

## GET `/api/mood`
Gets counts of all user's captured moods

## GET `/api/mood/:mood_id/locations`
Gets most frequent locations for a user's moods
