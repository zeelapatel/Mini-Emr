'use strict';

require('dotenv').config();
const path = require('path');
const bcrypt = require('bcrypt');
const { db, initializeDatabase } = require('./database');

// Seed data as provided
const seedData = {
  "users": [
    {
      "id": 1,
      "name": "Mark Johnson",
      "email": "mark@some-email-provider.net",
      "password": "Password123!",
      "appointments": [
        {
          "id": 1,
          "provider": "Dr Kim West",
          "datetime": "2025-09-16T16:30:00.000-07:00",
          "repeat": "weekly"
        },
        {
          "id": 2,
          "provider": "Dr Lin James",
          "datetime": "2025-09-19T18:30:00.000-07:00",
          "repeat": "monthly"
        }
      ],
      "prescriptions": [
        {
          "id": 1,
          "medication": "Lexapro",
          "dosage": "5mg",
          "quantity": 2,
          "refill_on": "2025-10-05",
          "refill_schedule": "monthly"
        },
        {
          "id": 2,
          "medication": "Ozempic",
          "dosage": "1mg",
          "quantity": 1,
          "refill_on": "2025-10-10",
          "refill_schedule": "monthly"
        }
      ]
    },
    {
      "id": 2,
      "name": "Lisa Smith",
      "email": "lisa@some-email-provider.net",
      "password": "Password123!",
      "appointments": [
        {
          "id": 3,
          "provider": "Dr Sally Field",
          "datetime": "2025-09-22T18:15:00.000-07:00",
          "repeat": "monthly"
        },
        {
          "id": 4,
          "provider": "Dr Lin James",
          "datetime": "2025-09-25T20:00:00.000-07:00",
          "repeat": "weekly"
        }
      ],
      "prescriptions": [
        {
          "id": 3,
          "medication": "Metformin",
          "dosage": "500mg",
          "quantity": 2,
          "refill_on": "2025-10-15",
          "refill_schedule": "monthly"
        },
        {
          "id": 4,
          "medication": "Diovan",
          "dosage": "100mg",
          "quantity": 1,
          "refill_on": "2025-10-25",
          "refill_schedule": "monthly"
        }
      ]
    }
  ],
  "medications": ["Diovan", "Lexapro", "Metformin", "Ozempic", "Prozac", "Seroquel", "Tegretol"],
  "dosages": ["1mg", "2mg", "3mg", "5mg", "10mg", "25mg", "50mg", "100mg", "250mg", "500mg", "1000mg"]
};

initializeDatabase();

function runAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve(this);
    });
  });
}

function allAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

async function seed() {
  try {
    await runAsync('BEGIN TRANSACTION');

    // Clear tables to allow re-seeding idempotently
    await runAsync('DELETE FROM prescriptions');
    await runAsync('DELETE FROM appointments');
    await runAsync('DELETE FROM users');

    for (const user of seedData.users) {
      const hashed = await bcrypt.hash(user.password, 10);
      await runAsync(
        `INSERT INTO users (id, name, email, password) VALUES (?, ?, ?, ?)`,
        [user.id, user.name, user.email, hashed]
      );

      for (const appt of user.appointments) {
        await runAsync(
          `INSERT INTO appointments (id, user_id, provider, datetime, repeat) VALUES (?, ?, ?, ?, ?)`,
          [appt.id, user.id, appt.provider, appt.datetime, appt.repeat]
        );
      }

      for (const rx of user.prescriptions) {
        await runAsync(
          `INSERT INTO prescriptions (id, user_id, medication, dosage, quantity, refill_on, refill_schedule) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [rx.id, user.id, rx.medication, rx.dosage, rx.quantity, rx.refill_on, rx.refill_schedule]
        );
      }
    }

    await runAsync('COMMIT');
    console.log('Database seeded successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    try { await runAsync('ROLLBACK'); } catch (_) {}
    process.exit(1);
  }
}

seed();


