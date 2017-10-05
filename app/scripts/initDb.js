/**
 * Create DB Script
 *
 * Uses the app's DB connector instead of worrying about how to find and connect to a sqlite db.
 */

const promiseDb = require('../io/promiseDb');

promiseDb.then((db) => {
  db.serialize(() => {
    db.run(`
      CREATE TABLE mood (
        mood_id INTEGER PRIMARY KEY,
        mood_desc TEXT NOT NULL UNIQUE
      )`,
    );

    db.run(`
      CREATE UNIQUE INDEX idx_mood_uniq
      ON mood (mood_desc) 
    `);

    db.run(`
      CREATE TABLE capture (
        capture_id INTEGER PRIMARY KEY,
        user_id INTEGER NOT NULL,
        timestamp DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        mood_id INTEGER,
        mood_timestamp DATE,
        FOREIGN KEY (mood_id) REFERENCES mood (mood_id)
      )`,
    );

    db.run(`
      CREATE TABLE location (
        location_id INTEGER PRIMARY KEY,
        location_desc TEXT NOT NULL UNIQUE
      )`,
    );

    db.run(`
      CREATE UNIQUE INDEX idx_location_uniq
      ON location (location_desc) 
    `);

    // capture <--> location many-many join table
    db.run(`
      CREATE TABLE capture_location (
        location_id INTEGER,
        capture_id INTEGER,
        
        PRIMARY KEY (location_id, capture_id),
        
        FOREIGN KEY (location_id) REFERENCES location (location_id),
        FOREIGN KEY (capture_id) REFERENCES capture (capture_id)
      )`,
    );
  });
});
