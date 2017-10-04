/**
 * Exports a Promise that gets resolved when sqlite database connector is ready,
 * where all methods have been promisified by bluebird into xxxAsync().
 *
 * If first time starting up, creates a sqlite DB at ../sqlite.db
 *
 * ie to use: require('db').then(db => ...)
 */

const sqlite3 = require('sqlite3');
const { TransactionDatabase } = require('sqlite3-transactions');
const Promise = require('bluebird');

let db = null;
let transactionDb;
const dbReady = new Promise((resolve, reject) => {
  db = Promise.promisifyAll(
    new sqlite3.Database(`${__dirname}/../sqlite.db`, (error) => {
      if (error) {
        let dbFail = new Error('Could not create DB');
        dbFail.why = error;
        reject(error);
        return;
      }

      transactionDb = new TransactionDatabase(db);

      // bluebird's promisifyAll() doesn't play well with sqlite-transaction's wrapping method.  Therefore, create a
      // thin wrapper around sqlite-transaction with the underlying promise-ified sqlite normally exposed.
      db.beginTransaction = callback => transactionDb.beginTransaction(callback);

      resolve(db);
    }),
  );
});

module.exports = dbReady;
