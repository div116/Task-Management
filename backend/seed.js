require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');

const seedUsers = [
  {
    username: 'admin_manager',
    email: 'manager@tracify.com',
    password: 'Manager@123',
    role: 'manager',
  },
  {
    username: 'teamlead_one',
    email: 'teamlead@tracify.com',
    password: 'TeamLead@123',
    role: 'teamlead',
  },
  {
    username: 'employee_one',
    email: 'employee@tracify.com',
    password: 'Employee@123',
    role: 'employee',
  },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      tls: true,
      tlsAllowInvalidCertificates: false,
    });
    console.log('Connected to MongoDB\n');

    for (const userData of seedUsers) {
      const existing = await User.findOne({ email: userData.email });
      if (existing) {
        console.log(`SKIP  - ${userData.role.padEnd(9)} already exists: ${userData.email}`);
        continue;
      }
      await User.create(userData);
      console.log(`CREATE - ${userData.role.padEnd(9)} created: ${userData.email}  /  password: ${userData.password}`);
    }

    console.log('\nDone! Use the credentials above to log in.');
  } catch (err) {
    console.error('Seed error:', err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seed();
