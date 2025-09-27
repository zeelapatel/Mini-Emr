'use strict';

const express = require('express');
const { db } = require('../db/database');
const { calculateNextAppointments } = require('../utils/recurrence');

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

// GET /api/appointments/patient/:patientId
router.get('/patient/:patientId', async (req, res) => {
  try {
    const patientId = Number(req.params.patientId);
    if (!Number.isInteger(patientId)) return res.status(400).json({ error: 'Invalid patientId' });
    const includeFuture = String(req.query.includeFuture || 'false').toLowerCase() === 'true';
    const rows = await allAsync('SELECT * FROM appointments WHERE user_id = ? ORDER BY datetime DESC', [patientId]);
    if (!includeFuture) return res.json({ appointments: rows });
    const expanded = [];
    for (const a of rows) {
      const next = calculateNextAppointments(a, 3);
      if (next.length === 0) continue;
      for (const dt of next) {
        expanded.push({ ...a, datetime: dt });
      }
    }
    expanded.sort((x, y) => new Date(x.datetime) - new Date(y.datetime));
    return res.json({ appointments: expanded });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/appointments/:id
router.get('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid id' });
    const row = await getAsync('SELECT * FROM appointments WHERE id = ?', [id]);
    if (!row) return res.status(404).json({ error: 'Not found' });
    return res.json({ appointment: row });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/appointments
router.post('/', async (req, res) => {
  try {
    const { user_id, provider, datetime, repeat, end_date } = req.body || {};
    if (!user_id || !provider || !datetime || !repeat) {
      return res.status(400).json({ error: 'user_id, provider, datetime, repeat are required' });
    }
    const now = new Date();
    const dt = new Date(datetime);
    if (isNaN(dt.getTime())) return res.status(400).json({ error: 'Invalid datetime' });
    if (dt < now) return res.status(400).json({ error: 'Appointment cannot be in the past' });
    if (end_date) {
      const ed = new Date(end_date);
      if (isNaN(ed.getTime())) return res.status(400).json({ error: 'Invalid end_date' });
      if (ed < dt) return res.status(400).json({ error: 'end_date cannot be before start datetime' });
    }
    const result = await runAsync(
      'INSERT INTO appointments (user_id, provider, datetime, repeat, end_date) VALUES (?, ?, ?, ?, ?)',
      [user_id, provider, datetime, repeat, end_date || null]
    );
    const created = await getAsync('SELECT * FROM appointments WHERE id = ?', [result.lastID]);
    return res.status(201).json({ appointment: created });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/appointments/:id
router.put('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid id' });
    const { user_id, provider, datetime, repeat, end_date } = req.body || {};
    const updates = [];
    const params = [];
    if (user_id) { updates.push('user_id = ?'); params.push(user_id); }
    if (provider) { updates.push('provider = ?'); params.push(provider); }
    if (datetime) {
      const dt = new Date(datetime);
      if (isNaN(dt.getTime())) return res.status(400).json({ error: 'Invalid datetime' });
      if (dt < new Date()) return res.status(400).json({ error: 'Appointment cannot be in the past' });
      updates.push('datetime = ?'); params.push(datetime);
    }
    if (repeat) { updates.push('repeat = ?'); params.push(repeat); }
    if (end_date !== undefined) { updates.push('end_date = ?'); params.push(end_date || null); }
    if (updates.length === 0) return res.status(400).json({ error: 'Nothing to update' });
    params.push(id);
    await runAsync(`UPDATE appointments SET ${updates.join(', ')} WHERE id = ?`, params);
    const updated = await getAsync('SELECT * FROM appointments WHERE id = ?', [id]);
    if (!updated) return res.status(404).json({ error: 'Not found' });
    return res.json({ appointment: updated });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/appointments/:id
router.delete('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid id' });
    await runAsync('DELETE FROM appointments WHERE id = ?', [id]);
    return res.status(204).send();
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;


