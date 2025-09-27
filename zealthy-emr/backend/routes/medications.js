'use strict';

const express = require('express');

const router = express.Router();

const medications = ["Diovan", "Lexapro", "Metformin", "Ozempic", "Prozac", "Seroquel", "Tegretol"];
const dosages = ["1mg", "2mg", "3mg", "5mg", "10mg", "25mg", "50mg", "100mg", "250mg", "500mg", "1000mg"];

router.get('/medications', (req, res) => {
  return res.json({ medications });
});

router.get('/dosages', (req, res) => {
  return res.json({ dosages });
});

module.exports = router;


