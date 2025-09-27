'use strict';

require('dotenv').config();
const bcrypt = require('bcrypt');
const { prisma } = require('./client');

// Import same seed data used earlier (inline to avoid fs in this snippet)
const seedData = {
  users: [
    {
      id: 1,
      name: 'Mark Johnson',
      email: 'mark@some-email-provider.net',
      password: 'Password123!',
      appointments: [
        { id: 1, provider: 'Dr Kim West', datetime: '2025-09-16T16:30:00.000-07:00', repeat: 'weekly' },
        { id: 2, provider: 'Dr Lin James', datetime: '2025-09-19T18:30:00.000-07:00', repeat: 'monthly' }
      ],
      prescriptions: [
        { id: 1, medication: 'Lexapro', dosage: '5mg', quantity: 2, refill_on: '2025-10-05', refill_schedule: 'monthly' },
        { id: 2, medication: 'Ozempic', dosage: '1mg', quantity: 1, refill_on: '2025-10-10', refill_schedule: 'monthly' }
      ]
    },
    {
      id: 2,
      name: 'Lisa Smith',
      email: 'lisa@some-email-provider.net',
      password: 'Password123!',
      appointments: [
        { id: 3, provider: 'Dr Sally Field', datetime: '2025-09-22T18:15:00.000-07:00', repeat: 'monthly' },
        { id: 4, provider: 'Dr Lin James', datetime: '2025-09-25T20:00:00.000-07:00', repeat: 'weekly' }
      ],
      prescriptions: [
        { id: 3, medication: 'Metformin', dosage: '500mg', quantity: 2, refill_on: '2025-10-15', refill_schedule: 'monthly' },
        { id: 4, medication: 'Diovan', dosage: '100mg', quantity: 1, refill_on: '2025-10-25', refill_schedule: 'monthly' }
      ]
    }
  ]
};

async function main() {
  // Clear tables
  await prisma.prescription.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.user.deleteMany();

  for (const u of seedData.users) {
    const hashed = await bcrypt.hash(u.password, 10);
    const created = await prisma.user.create({
      data: {
        name: u.name,
        email: u.email,
        password: hashed,
      },
    });

    for (const a of u.appointments) {
      await prisma.appointment.create({
        data: {
          userId: created.id,
          provider: a.provider,
          datetime: new Date(a.datetime),
          repeat: a.repeat || null,
        },
      });
    }
    for (const r of u.prescriptions) {
      await prisma.prescription.create({
        data: {
          userId: created.id,
          medication: r.medication,
          dosage: r.dosage,
          quantity: r.quantity,
          refillOn: r.refill_on ? new Date(r.refill_on) : null,
          refillSchedule: r.refill_schedule || null,
        },
      });
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log('Prisma seed completed');
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });


