import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import { seedDatabase } from './seedData.js';

dotenv.config();

const run = async () => {
  const connected = await connectDB();
  if (connected) {
    await seedDatabase();
    console.log('Seed runner completed.');
  } else {
    console.log('Database connection failed. Could not run seed runner.');
  }
  process.exit(0);
};

run();
