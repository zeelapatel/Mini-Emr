'use strict';

const express = require('express');
const { db } = require('../db/database');
const { calculateNextRefills } = require('../utils/recurrence');

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

// GET /api/prescriptions/patient/:patientId
router.get('/patient/:patientId', async (req, res) => {
  try {
    const patientId = Number(req.params.patientId);
    if (!Number.isInteger(patientId)) return res.status(400).json({ error: 'Invalid patientId' });
    const includeFuture = String(req.query.includeFuture || 'false').toLowerCase() === 'true';
    const rows = await allAsync('SELECT * FROM prescriptions WHERE user_id = ? ORDER BY created_at DESC', [patientId]);
    if (!includeFuture) return res.json({ prescriptions: rows });
    const projected = [];
    for (const r of rows) {
      const next = calculateNextRefills(r, 3);
      for (const dt of next) projected.push({ ...r, nextRefill: dt });
    }
    projected.sort((a, b) => new Date(a.nextRefill) - new Date(b.nextRefill));
    return res.json({ prescriptions: projected });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/prescriptions/:id
router.get('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid id' });
    const row = await getAsync('SELECT * FROM prescriptions WHERE id = ?', [id]);
    if (!row) return res.status(404).json({ error: 'Not found' });
    return res.json({ prescription: row });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/prescriptions
router.post('/', async (req, res) => {
  try {
    const { user_id, medication, dosage, quantity, refill_on, refill_schedule } = req.body || {};
    if (!user_id || !medication || !dosage || !quantity || !refill_on || !refill_schedule) {
      return res.status(400).json({ error: 'user_id, medication, dosage, quantity, refill_on, refill_schedule are required' });
    }
    if (Number(quantity) <= 0) return res.status(400).json({ error: 'quantity must be > 0' });
    const ro = new Date(refill_on);
    if (isNaN(ro.getTime())) return res.status(400).json({ error: 'Invalid refill_on' });
    const result = await runAsync(
      'INSERT INTO prescriptions (user_id, medication, dosage, quantity, refill_on, refill_schedule) VALUES (?, ?, ?, ?, ?, ?)',
      [user_id, medication, dosage, quantity, refill_on, refill_schedule]
    );
    const created = await getAsync('SELECT * FROM prescriptions WHERE id = ?', [result.lastID]);
    return res.status(201).json({ prescription: created });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/prescriptions/:id
router.put('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid id' });
    const { user_id, medication, dosage, quantity, refill_on, refill_schedule } = req.body || {};
    const updates = [];
    const params = [];
    if (user_id) { updates.push('user_id = ?'); params.push(user_id); }
    if (medication) { updates.push('medication = ?'); params.push(medication); }
    if (dosage) { updates.push('dosage = ?'); params.push(dosage); }
    if (quantity) {
      if (Number(quantity) <= 0) return res.status(400).json({ error: 'quantity must be > 0' });
      updates.push('quantity = ?'); params.push(quantity);
    }
    if (refill_on) {
      const ro = new Date(refill_on);
      if (isNaN(ro.getTime())) return res.status(400).json({ error: 'Invalid refill_on' });
      updates.push('refill_on = ?'); params.push(refill_on);
    }
    if (refill_schedule) { updates.push('refill_schedule = ?'); params.push(refill_schedule); }
    if (updates.length === 0) return res.status(400).json({ error: 'Nothing to update' });
    params.push(id);
    await runAsync(`UPDATE prescriptions SET ${updates.join(', ')} WHERE id = ?`, params);
    const updated = await getAsync('SELECT * FROM prescriptions WHERE id = ?', [id]);
    if (!updated) return res.status(404).json({ error: 'Not found' });
    return res.json({ prescription: updated });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/prescriptions/:id
router.delete('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid id' });
    await runAsync('DELETE FROM prescriptions WHERE id = ?', [id]);
    return res.status(204).send();
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;


