'use strict';

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initializeDatabase } = require('./db/database');
const authRoutes = require('./routes/auth');
const patientsRoutes = require('./routes/patients');
const appointmentsRoutes = require('./routes/appointments');
const prescriptionsRoutes = require('./routes/prescriptions');
const medicationsRoutes = require('./routes/medications');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS 
app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN || 'http://localhost:3000',
    credentials: true,
  })
);

// JSON body parser
app.use(express.json());

// Initialize DB and tables
initializeDatabase();
// Auto-seed on Render demo when DB is empty
if (process.env.RENDER && !process.env.SKIP_SEED) {
  try {
    const { db } = require('./db/database');
    db.get('SELECT COUNT(*) as c FROM users', async (err, row) => {
      if (err || (row && row.c === 0)) {
        try { require('./db/seed'); } catch (_) {}
      }
    });
  } catch (_) {}
}

// Basic health endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'zealthy-emr-backend', timestamp: new Date().toISOString() });
});

// Auth routes
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientsRoutes);
app.use('/api/appointments', appointmentsRoutes);
app.use('/api/prescriptions', prescriptionsRoutes);
app.use('/api', medicationsRoutes);

// Simple error handler
app.use((err, req, res, next) => {
  if (err && err.name === 'UnauthorizedError') {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  console.error(err);
  return res.status(500).json({ error: 'Server error' });
});

app.listen(PORT, () => {
  console.log(`API server listening on http://localhost:${PORT}`);
});


