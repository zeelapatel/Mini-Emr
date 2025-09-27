'use strict';

const { addWeeks, addMonths, isAfter, isBefore } = require('date-fns');

function toDateSafe(value) {
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

function calculateNextAppointments(appointment, months = 3) {
  const occurrences = [];
  const now = new Date();
  const limit = addMonths(now, months);
  const start = toDateSafe(appointment.datetime);
  if (!start) return occurrences;
  const endDate = appointment.end_date ? toDateSafe(appointment.end_date) : null;

  let current = new Date(start);
  while (isBefore(current, limit) || current.getTime() === limit.getTime()) {
    if (isAfter(current, now) || current.getTime() === now.getTime()) {
      if (!endDate || isBefore(current, endDate) || current.getTime() === endDate.getTime()) {
        occurrences.push(new Date(current).toISOString());
      } else {
        break;
      }
    }
    if (appointment.repeat === 'weekly') {
      current = addWeeks(current, 1);
    } else if (appointment.repeat === 'monthly') {
      current = addMonths(current, 1);
    } else {
      // no repeat
      break;
    }
  }
  return occurrences;
}

function calculateNextRefills(prescription, months = 3) {
  const refills = [];
  const now = new Date();
  const limit = addMonths(now, months);
  const start = toDateSafe(prescription.refill_on);
  if (!start) return refills;

  let current = new Date(start);
  while (isBefore(current, limit) || current.getTime() === limit.getTime()) {
    if (isAfter(current, now) || current.getTime() === now.getTime()) {
      refills.push(new Date(current).toISOString());
    }
    // Only monthly supported for now
    current = addMonths(current, 1);
  }
  return refills;
}

module.exports = { calculateNextAppointments, calculateNextRefills };


