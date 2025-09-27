'use strict';

const express = require('express');
const bcrypt = require('bcrypt');
const { prisma } = require('../prisma/client');

const router = express.Router();

// 1) GET /api/patients - list with counts
router.get('/', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true, name: true, email: true, createdAt: true,
        _count: { select: { appointments: true, prescriptions: true } }
      },
      orderBy: { id: 'asc' }
    });
    const results = users.map(u => ({
      id: u.id, name: u.name, email: u.email, created_at: u.createdAt,
      appointmentsCount: u._count.appointments,
      prescriptionsCount: u._count.prescriptions
    }));
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

    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, createdAt: true }
    });
    if (!user) return res.status(404).json({ error: 'Not found' });

    const appointments = await prisma.appointment.findMany({ where: { userId: id }, orderBy: { datetime: 'desc' } });
    const prescriptions = await prisma.prescription.findMany({ where: { userId: id }, orderBy: { createdAt: 'desc' } });

    return res.json({ patient: { id: user.id, name: user.name, email: user.email, created_at: user.createdAt }, appointments, prescriptions });
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

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ error: 'Email already exists' });

    const hashed = await bcrypt.hash(password, 10);
    const created = await prisma.user.create({ data: { name, email, password: hashed } });
    return res.status(201).json({ patient: { id: created.id, name: created.name, email: created.email, created_at: created.createdAt } });
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

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Not found' });

    const updates = [];
    const data = {};
    if (name) { updates.push('name'); data.name = name; }
    if (email) {
      if (!/.+@.+\..+/.test(email)) return res.status(400).json({ error: 'Invalid email' });
      updates.push('email'); data.email = email;
    }
    if (password) {
      const hashed = await bcrypt.hash(password, 10);
      updates.push('password');
      data.password = hashed;
    }
    const updated = await prisma.user.update({ where: { id }, data });
    return res.json({ patient: { id: updated.id, name: updated.name, email: updated.email, created_at: updated.createdAt } });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;


