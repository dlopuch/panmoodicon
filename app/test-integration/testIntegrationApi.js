/* eslint-env mocha */

const _ = require('lodash');
const assert = require('assert');
const Promise = require('bluebird');
const request = require('supertest'); // eslint-disable-line import/no-extraneous-dependencies

const app = require('../app');
const jwt = require('../business/jwtBusiness');

function getAuthFor(userId) {
  return { Authorization: jwt.createAuthHeader(userId) };
}

describe('API Integration Test', () => {
  describe('/api/capture', () => {
    it('POSTs new captures', () =>
      request(app)
      .post('/api/capture')
      .set(getAuthFor(101))
      .send({ captureData: 'some jpeg info' })
      .expect(200)
      .expect((res) => {
        assert.ok(res.body.capture_id, 'missing a capture_id');
        assert.ok(res.body.mood_id === null, 'expected mood_id to be null');
        assert.deepEqual(res.body.location_ids, [], 'expected no locations yet');
      }),
    );

    describe('/:capture_id', () => {
      it("GET's previously-posted captures", () =>
        request(app)
        .post('/api/capture').send({ captureData: 'some jpeg info' }).expect(200)
        .set(getAuthFor(102))
        .then(postResp =>
          request(app)
          .get(`/api/capture/${postResp.body.capture_id}`)
          .set(getAuthFor(102))
          .expect(200)
          .expect((res) => {
            assert.deepEqual(res.body, postResp.body, 'Expected GET to be same result as POST');
          }),
        ),
      );

      it('GET fills in background service info after waiting a bit', () =>
        request(app)
        .post('/api/capture').send({ captureData: 'some jpeg info' })
        .set(getAuthFor(103))
        .expect(200)

        // Wait for background services to finish mood and location coding
        // TODO: Instead of hardcoded waits, could do an applicationContext with promise-controlled mock services
        //       and force them to finish.  But that's a crazy layer of indirection  : )
        .then(postResp => new Promise(resolve =>
          setTimeout(() => resolve(postResp), 1300), // Mock services wait at most 1000ms
        ))

        .then(postResp =>
          request(app)
          .get(`/api/capture/${postResp.body.capture_id}`)
          .set(getAuthFor(103))
          .expect(200)
          .expect((res) => {
            assert.ok(res.body.mood_id, 'expected mood_id to be filled in');
            assert.ok(res.body.location_ids, 'expected locations to exist');
          }),
        ),
      );
    });
  });


  describe('/api/mood', () => {
    let setupCapturesByMoodId;

    // All of these tests as same user
    const API_MOOD_USER_ID = 104;

    // Before these ones: send off 10 POST requests and count up the results
    before(function() {
      this.timeout(5000); // Let background services run

      setupCapturesByMoodId = {};

      return Promise.map(
        [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        n =>
          request(app).post('/api/capture')
          .send({ captureData: `data ${n}` })
          .set(getAuthFor(API_MOOD_USER_ID))
          .expect(200)

          // Wait for background services to finish mood and location coding
          .then(postResp => new Promise(resolve =>
            setTimeout(() => resolve(postResp), 1300), // Mock services wait at most 1000ms
          ))

          .then(postResp =>
            request(app)
            .get(`/api/capture/${postResp.body.capture_id}`)
            .set(getAuthFor(API_MOOD_USER_ID))
            .expect(200)
            .expect((res) => {
              setupCapturesByMoodId[res.body.mood_id] = setupCapturesByMoodId[res.body.mood_id] || { count: 0, location_ids: [] };

              setupCapturesByMoodId[res.body.mood_id].count += 1;
              res.body.location_ids.forEach(lid => setupCapturesByMoodId[res.body.mood_id].location_ids.push(lid));
            }),
          ),
      );
    });

    it("GET's the frequency histogram of moods", () =>
      request(app)
      .get('/api/mood')
      .set(getAuthFor(API_MOOD_USER_ID))
      .expect(200)
      .expect((res) => {
        // We want reported frequencies to be at least the number of ones we created in this test
        _.toPairs(res.body).forEach(kvPair =>
          assert.ok(
            kvPair[1].count >= setupCapturesByMoodId[kvPair[1].mood_id].count,
            `Too few count for mood ${kvPair[0]}. Expected at least ${setupCapturesByMoodId[kvPair[1].mood_id].count}`,
          ),
        );
      }),
    );

    describe('/:mood_id/locations', () => {
      it("GET's the count of locations for each created mood",
        () => Promise.map(
          _.keys(setupCapturesByMoodId),
          moodId =>
            request(app)
            .get(`/api/mood/${moodId}/locations`)
            .set(getAuthFor(API_MOOD_USER_ID))
            .expect(200)
            .expect((res) => {
              let expectedLocationIds = _.uniq(setupCapturesByMoodId[moodId].location_ids);
              let actualLocationIds = _.keyBy(res.body, 'location_id'); // build index

              expectedLocationIds.forEach(expLocId =>
                assert.ok(actualLocationIds[expLocId] !== undefined, `Mood ${moodId} is missing expected location ${expLocId}`),
              );
            }),
        ),
      );
    });
  });
});
