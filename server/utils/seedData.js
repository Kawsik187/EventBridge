import Department from '../models/Department.js';
import Venue from '../models/Venue.js';
import User from '../models/User.js';
import { seedSampleEvents } from './seedEvents.js';

export const DEPARTMENTS = [
  {
    name: 'Automobile Engineering',
    code: 'AUTO',
    description: 'Vehicle dynamics, automotive electronics, EV propulsion, and mobility engineering.',
  },
  {
    name: 'Biomedical Engineering',
    code: 'BME',
    description: 'Medical instrumentation, biosensors, clinical engineering, and assistive technologies.',
  },
  {
    name: 'Civil Engineering',
    code: 'CIVIL',
    description: 'Structural design, environmental engineering, geotechnical analysis, and smart city infrastructure.',
  },
  {
    name: 'Computer Science and Engineering (CSE)',
    code: 'CSE',
    description: 'Core computing, systems engineering, distributed architecture, and software development.',
  },
  {
    name: 'Computer Science and Engineering – Artificial Intelligence & Machine Learning',
    code: 'AIML',
    description: 'Deep learning, neural architectures, computer vision, and cognitive systems.',
  },
  {
    name: 'Computer Science and Engineering – Cyber Security',
    code: 'CYBER',
    description: 'Network defense, threat intelligence, cryptography, and secure systems engineering.',
  },
  {
    name: 'Computer Science and Design',
    code: 'CSD',
    description: 'Human-computer interaction, interactive media, UI/UX systems, and computational creative design.',
  },
  {
    name: 'Electrical and Electronics Engineering (EEE)',
    code: 'EEE',
    description: 'Power distribution, renewable energy grids, electric drives, and industrial automation.',
  },
  {
    name: 'Electronics and Communication Engineering (ECE)',
    code: 'ECE',
    description: 'Wireless communications, signal processing, VLSI design, and RF circuits.',
  },
  {
    name: 'Electronics and Instrumentation Engineering (EIE)',
    code: 'EIE',
    description: 'Process automation, sensor integration, cyber-physical systems, and industrial instrumentation.',
  },
  {
    name: 'Mechanical Engineering',
    code: 'MECH',
    description: 'Thermodynamics, additive manufacturing, CAD/CAM robotics, and materials science.',
  },
  {
    name: 'Robotics and Automation Engineering',
    code: 'RA',
    description: 'Autonomous systems, robotic manipulators, Mechatronics, and industrial automation.',
  },
  {
    name: 'Artificial Intelligence and Data Science (AI & DS)',
    code: 'AIDS',
    description: 'Big data analytics, probabilistic modeling, enterprise AI solutions, and data pipelines.',
  },
  {
    name: 'Information Technology (IT)',
    code: 'IT',
    description: 'Enterprise web systems, cloud computing, database engineering, and software solutions.',
  },
  {
    name: 'Biotechnology',
    code: 'BIO',
    description: 'Bioprocess engineering, genomic analysis, bioinformatics, and pharmaceutical biotechnology.',
  },
];

export const VENUES = [
  {
    name: 'Innovation Lab',
    code: 'INV-LAB-01',
    location: 'Block A - 2nd Floor',
    capacity: 100,
    amenities: ['High-speed Wi-Fi', 'High-end Workstations', 'Projector & Screen', 'Air Conditioning', 'Power Outlets'],
  },
  {
    name: 'Main Auditorium',
    code: 'AUD-MAIN',
    location: 'Central Academic Complex',
    capacity: 500,
    amenities: ['Surround Sound System', 'Stage Lighting', 'Green Rooms', 'Live Streaming Setup', 'Air Conditioning'],
  },
  {
    name: 'Media Studio',
    code: 'MED-STD-02',
    location: 'Block C - Ground Floor',
    capacity: 60,
    amenities: ['Acoustic Treatment', '4K Cameras', 'Professional Mics', 'Chroma Key Backdrop'],
  },
  {
    name: 'Open Air Amphitheatre',
    code: 'OAT-CAMPUS',
    location: 'Campus Quadrangle Garden',
    capacity: 1200,
    amenities: ['Outdoor Sound Rig', 'Festival Lighting', 'Ramp Access', 'Open Seating'],
  },
  {
    name: 'Seminar Hall A',
    code: 'SEM-HALL-A',
    location: 'Block B - 3rd Floor',
    capacity: 150,
    amenities: ['Smart Podium', 'Dual Projectors', 'Wireless Mics', 'Tiered Seating', 'Air Conditioning'],
  },
  {
    name: 'Campus Sports Complex',
    code: 'SPT-CMPLX',
    location: 'South Campus Ground',
    capacity: 800,
    amenities: ['Floodlights', 'Digital Scoreboard', 'Medical Bay', 'Changing Rooms'],
  },
  {
    name: 'Robotics & Maker Space',
    code: 'ROB-MAKER-01',
    location: 'Mechanical Sciences Block - 1st Floor',
    capacity: 80,
    amenities: ['3D Printers', 'Laser Cutters', 'Soldering Stations', 'High-voltage Bench Power'],
  },
];

/**
 * Idempotently seed the 15 official college departments
 */
export const seedDepartments = async () => {
  console.log('[Seed] Seeding 15 Official College Departments...');
  for (const dept of DEPARTMENTS) {
    await Department.findOneAndUpdate(
      { code: dept.code },
      {
        $set: {
          name: dept.name,
          code: dept.code,
          description: dept.description,
          status: 'active',
        },
      },
      { upsert: true, new: true }
    );
  }
  const count = await Department.countDocuments();
  console.log(`[Seed] 15 Departments verified and active in database (Total: ${count}).`);
};

/**
 * Idempotently seed college venues
 */
export const seedVenues = async () => {
  for (const venue of VENUES) {
    await Venue.findOneAndUpdate(
      { code: venue.code },
      { $set: venue },
      { upsert: true, new: true }
    );
  }
};

/**
 * Bootstrap the initial admin securely from environment variables
 */
export const bootstrapInitialAdmin = async () => {
  const adminEmail = (process.env.INITIAL_ADMIN_EMAIL || 'admin@campus.edu').toLowerCase().trim();
  const adminPassword = process.env.INITIAL_ADMIN_PASSWORD || 'AdminSecurePassword2026!';

  const adminExists = await User.findOne({ role: 'admin' });
  let targetUser = await User.findOne({ email: adminEmail }).select('+password');

  if (!targetUser && !adminExists) {
    console.log(`[Bootstrap] Creating initial campus administrator account (${adminEmail})...`);
    await User.create({
      name: 'Campus Admin Office',
      email: adminEmail,
      password: adminPassword,
      role: 'admin',
      department: 'Dean of Student Affairs',
      status: 'active',
      collegeId: 'ADM-001',
    });
    console.log('[Bootstrap] Initial campus administrator created successfully.');
  } else if (targetUser) {
    // Preserve existing password, only ensure active status and admin role
    let modified = false;
    if (targetUser.role !== 'admin') {
      targetUser.role = 'admin';
      modified = true;
    }
    if (targetUser.status !== 'active') {
      targetUser.status = 'active';
      modified = true;
    }
    if (modified) {
      await targetUser.save();
      console.log(`[Bootstrap] Admin account (${adminEmail}) verified.`);
    }
  }
};

/**
 * Initialize baseline system configuration (departments, venues, admin)
 */
export const initializeBaselineData = async () => {
  await seedDepartments();
  await seedVenues();
  await bootstrapInitialAdmin();
};

/**
 * Main Database Seed / Initialization function
 * Demo events are only seeded if explicitly requested or running seed script.
 */
export const seedDatabase = async (forceDemo = false) => {
  try {
    await initializeBaselineData();
    const shouldSeedDemo = forceDemo || process.env.SEED_DEMO_DATA === 'true' || process.env.NODE_ENV !== 'production';
    if (shouldSeedDemo) {
      await seedSampleEvents();
    }
    console.log('[Seed] Database initialization complete.');
  } catch (error) {
    console.error('[Seed] Error initializing database:', error);
  }
};
