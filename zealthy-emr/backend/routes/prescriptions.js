'use strict';

const express = require('express');
const { prisma } = require('../prisma/client');
const { calculateNextRefills } = require('../utils/recurrence');

const router = express.Router();

// sqlite helpers removed; using Prisma

// GET /api/prescriptions/patient/:patientId
router.get('/patient/:patientId', async (req, res) => {
  try {
    const patientId = Number(req.params.patientId);
    if (!Number.isInteger(patientId)) return res.status(400).json({ error: 'Invalid patientId' });
    const includeFuture = String(req.query.includeFuture || 'false').toLowerCase() === 'true';
    const rows = await prisma.prescription.findMany({ where: { userId: patientId }, orderBy: { createdAt: 'desc' } });
    if (!includeFuture) return res.json({ prescriptions: rows });
    const projected = [];
    for (const r of rows) {
      const next = calculateNextRefills({ refill_on: r.refillOn, refillOn: r.refillOn }, 3);
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
    const row = await prisma.prescription.findUnique({ where: { id } });
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
    const created = await prisma.prescription.create({ data: {
      userId: Number(user_id), medication, dosage, quantity: Number(quantity), refillOn: ro, refillSchedule: refill_schedule
    }});
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
    const data = {};
    if (user_id) data.userId = Number(user_id);
    if (medication) data.medication = medication;
    if (dosage) data.dosage = dosage;
    if (quantity) {
      if (Number(quantity) <= 0) return res.status(400).json({ error: 'quantity must be > 0' });
      data.quantity = Number(quantity);
    }
    if (refill_on) {
      const ro2 = new Date(refill_on);
      if (isNaN(ro2.getTime())) return res.status(400).json({ error: 'Invalid refill_on' });
      data.refillOn = ro2;
    }
    if (refill_schedule) data.refillSchedule = refill_schedule;
    if (Object.keys(data).length === 0) return res.status(400).json({ error: 'Nothing to update' });
    const updated = await prisma.prescription.update({ where: { id }, data });
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
    await prisma.prescription.delete({ where: { id } });
    return res.status(204).send();
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;


