'use strict';

const express = require('express');
const bcrypt = require('bcrypt');
const { db } = require('../db/database');

const router = express.Router();

function allAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
  });
}

function getAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row)));
  });
}

function runAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve(this);
    });
  });
}

// 1) GET /api/patients - list with counts
router.get('/', async (req, res) => {
  try {
    const users = await allAsync('SELECT id, name, email, created_at FROM users');
    const results = [];
    for (const u of users) {
      const [{ count: apptCount } = { count: 0 }] = await allAsync('SELECT COUNT(*) AS count FROM appointments WHERE user_id = ?', [u.id]);
      const [{ count: rxCount } = { count: 0 }] = await allAsync('SELECT COUNT(*) AS count FROM prescriptions WHERE user_id = ?', [u.id]);
      results.push({ ...u, appointmentsCount: apptCount, prescriptionsCount: rxCount });
    }
    return res.json({ patients: results });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

// 2) GET /api/patients/:id - full details
router.get('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid id' });

    const user = await getAsync('SELECT id, name, email, created_at FROM users WHERE id = ?', [id]);
    if (!user) return res.status(404).json({ error: 'Not found' });

    const appointments = await allAsync('SELECT id, provider, datetime, repeat, created_at FROM appointments WHERE user_id = ? ORDER BY datetime DESC', [id]);
    const prescriptions = await allAsync('SELECT id, medication, dosage, quantity, refill_on, refill_schedule, created_at FROM prescriptions WHERE user_id = ? ORDER BY created_at DESC', [id]);

    return res.json({ patient: user, appointments, prescriptions });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

// 3) POST /api/patients - create
router.post('/', async (req, res) => {
  try {
    const { name, email, password } = req.body || {};
    if (!name || !email || !password) return res.status(400).json({ error: 'name, email, and password are required' });
    if (!/.+@.+\..+/.test(email)) return res.status(400).json({ error: 'Invalid email' });
    if (String(password).length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

    const existing = await getAsync('SELECT id FROM users WHERE email = ?', [email]);
    if (existing) return res.status(409).json({ error: 'Email already exists' });

    const hashed = await bcrypt.hash(password, 10);
    const result = await runAsync('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', [name, email, hashed]);
    const created = await getAsync('SELECT id, name, email, created_at FROM users WHERE id = ?', [result.lastID]);
    return res.status(201).json({ patient: created });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

// 4) PUT /api/patients/:id - update
router.put('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid id' });

    const { name, email, password } = req.body || {};
    if (!name && !email && !password) return res.status(400).json({ error: 'Nothing to update' });

    const existing = await getAsync('SELECT id FROM users WHERE id = ?', [id]);
    if (!existing) return res.status(404).json({ error: 'Not found' });

    const updates = [];
    const params = [];
    if (name) { updates.push('name = ?'); params.push(name); }
    if (email) {
      if (!/.+@.+\..+/.test(email)) return res.status(400).json({ error: 'Invalid email' });
      updates.push('email = ?'); params.push(email);
    }
    if (password) {
      const hashed = await bcrypt.hash(password, 10);
      updates.push('password = ?');
      params.push(hashed);
    }
    params.push(id);

    await runAsync(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);
    const updated = await getAsync('SELECT id, name, email, created_at FROM users WHERE id = ?', [id]);
    return res.json({ patient: updated });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;


