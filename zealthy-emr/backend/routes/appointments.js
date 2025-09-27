'use strict';

const express = require('express');
const { prisma } = require('../prisma/client');
const { calculateNextAppointments } = require('../utils/recurrence');

const router = express.Router();

// sqlite helpers removed; using Prisma

// GET /api/appointments/patient/:patientId
router.get('/patient/:patientId', async (req, res) => {
  try {
    const patientId = Number(req.params.patientId);
    if (!Number.isInteger(patientId)) return res.status(400).json({ error: 'Invalid patientId' });
    const includeFuture = String(req.query.includeFuture || 'false').toLowerCase() === 'true';
    const rows = await prisma.appointment.findMany({ where: { userId: patientId }, orderBy: { datetime: 'desc' } });
    if (!includeFuture) return res.json({ appointments: rows });
    const expanded = [];
    for (const a of rows) {
      const next = calculateNextAppointments({ datetime: a.datetime, repeat: a.repeat, end_date: a.endDate, endDate: a.endDate }, 3);
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
    const row = await prisma.appointment.findUnique({ where: { id } });
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
    const created = await prisma.appointment.create({ data: { userId: Number(user_id), provider, datetime: new Date(datetime), repeat, endDate: end_date ? new Date(end_date) : null } });
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
    const updates = {};
    if (user_id) { updates.userId = Number(user_id); }
    if (provider) { updates.provider = provider; }
    if (datetime) {
      const dt = new Date(datetime);
      if (isNaN(dt.getTime())) return res.status(400).json({ error: 'Invalid datetime' });
      if (dt < new Date()) return res.status(400).json({ error: 'Appointment cannot be in the past' });
      updates.datetime = new Date(datetime);
    }
    if (repeat) { updates.repeat = repeat; }
    if (end_date !== undefined) { updates.endDate = end_date ? new Date(end_date) : null; }
    if (Object.keys(updates).length === 0) return res.status(400).json({ error: 'Nothing to update' });
    const updated = await prisma.appointment.update({ where: { id }, data: updates });
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
    await prisma.appointment.delete({ where: { id } });
    return res.status(204).send();
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;


