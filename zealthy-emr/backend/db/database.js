'use strict';

const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const DATABASE_URL = process.env.DATABASE_URL || path.join(__dirname, '..', 'database.sqlite');

const db = new sqlite3.Database(DATABASE_URL);

function initializeDatabase() {
  db.serialize(() => {
    db.run('PRAGMA foreign_keys = ON');

    db.run(
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`
    );

    db.run(
      `CREATE TABLE IF NOT EXISTS appointments (
        id INTEGER PRIMARY KEY,
        user_id INTEGER NOT NULL,
        provider TEXT NOT NULL,
        datetime TEXT NOT NULL,
        repeat TEXT,
        end_date TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )`
    );

    db.run(
      `CREATE TABLE IF NOT EXISTS prescriptions (
        id INTEGER PRIMARY KEY,
        user_id INTEGER NOT NULL,
        medication TEXT NOT NULL,
        dosage TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        refill_on TEXT,
        refill_schedule TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )`
    );

    // Ensure end_date column exists for older databases
    db.all(`PRAGMA table_info(appointments)`, (err, rows) => {
      if (err) return; // silent
      const hasEndDate = Array.isArray(rows) && rows.some((r) => r.name === 'end_date');
      if (!hasEndDate) {
        db.run(`ALTER TABLE appointments ADD COLUMN end_date TEXT`);
      }
    });
  });
}

module.exports = { db, initializeDatabase };


