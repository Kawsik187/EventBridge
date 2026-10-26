import mongoose from 'mongoose';
import Event from '../models/Event.js';
import Department from '../models/Department.js';
import Venue from '../models/Venue.js';
import User from '../models/User.js';

const SAMPLE_ORGANIZERS = [
  {
    email: 'cse.organizer@srmeaswari.ac.in',
    name: 'Dr. K. Anita (CSE Faculty Lead)',
    deptCode: 'CSE',
    phone: '+91 94441 22334',
    collegeId: 'FAC-CSE-101',
  },
  {
    email: 'aiml.organizer@srmeaswari.ac.in',
    name: 'Dr. R. Vignesh (AI Research Lead)',
    deptCode: 'AIML',
    phone: '+91 94441 33445',
    collegeId: 'FAC-AIML-102',
  },
  {
    email: 'csd.organizer@srmeaswari.ac.in',
    name: 'Prof. S. Meenakshi (Design & Arts Guild)',
    deptCode: 'CSD',
    phone: '+91 94441 44556',
    collegeId: 'FAC-CSD-103',
  },
  {
    email: 'mech.organizer@srmeaswari.ac.in',
    name: 'Dr. P. Ramesh (Mechanical & Sports Dean)',
    deptCode: 'MECH',
    phone: '+91 94441 55667',
    collegeId: 'FAC-MECH-104',
  },
  {
    email: 'ra.organizer@srmeaswari.ac.in',
    name: 'Dr. G. Karthik (Robotics Club Mentor)',
    deptCode: 'RA',
    phone: '+91 94441 66778',
    collegeId: 'FAC-RA-105',
  },
  {
    email: 'bme.organizer@srmeaswari.ac.in',
    name: 'Dr. V. Deepa (MedTech Cell Head)',
    deptCode: 'BME',
    phone: '+91 94441 77889',
    collegeId: 'FAC-BME-106',
  },
  {
    email: 'cyber.organizer@srmeaswari.ac.in',
    name: 'Dr. M. Arvind (Cyber Defense Unit)',
    deptCode: 'CYBER',
    phone: '+91 94441 88990',
    collegeId: 'FAC-CYBER-107',
  },
  {
    email: 'it.organizer@srmeaswari.ac.in',
    name: 'Dr. K. Suresh (IT Department Lead)',
    deptCode: 'IT',
    phone: '+91 94441 99001',
    collegeId: 'FAC-IT-108',
  },
];

export const seedSampleEvents = async () => {
  console.log('[Seed] Seeding sample campus organizers and upcoming events...');

  // 1. Ensure department organizers exist and are active
  const organizerMap = {};
  for (const org of SAMPLE_ORGANIZERS) {
    const dept = await Department.findOne({ code: org.deptCode });
    if (!dept) continue;

    let user = await User.findOne({ email: org.email });
    if (!user) {
      user = await User.create({
        name: org.name,
        email: org.email,
        password: 'OrganizerSecurePassword2026!',
        role: 'organizer',
        department: dept.name,
        departmentId: dept._id,
        organizerStatus: 'active',
        status: 'active',
        phone: org.phone,
        collegeId: org.collegeId,
      });
    } else {
      user.role = 'organizer';
      user.departmentId = dept._id;
      user.department = dept.name;
      user.organizerStatus = 'active';
      user.status = 'active';
      await user.save();
    }

    // Set as active organizer on department if not set
    if (!dept.activeOrganizerId) {
      dept.activeOrganizerId = user._id;
      await dept.save();
    }

    organizerMap[org.deptCode] = { user, dept };
  }

  // 2. Fetch venues
  const venues = await Venue.find({});
  const venueMap = {};
  venues.forEach((v) => {
    venueMap[v.code] = v;
  });

  const getVenue = (code, fallbackIndex = 0) => venueMap[code] || venues[fallbackIndex] || null;

  // 3. Define 8 rich upcoming campus events
  const newEventsData = [
    {
      title: 'HackNova 2026: 36-Hour National AI Hackathon',
      slug: 'hacknova-2026-national-ai-hackathon',
      category: 'Hackathon',
      description:
        'A premier 36-hour national collegiate hackathon challenging student developers to build autonomous Generative AI agents, intelligent healthcare assistants, and decentralized Web3 platforms. Featuring live mentorship from industry architects and cash prizes worth ₹1,50,000.',
      deptCode: 'CSE',
      venueCode: 'INV-LAB-01',
      date: '2026-10-28',
      startTime: '09:00',
      endTime: '21:00',
      registrationDeadline: '2026-10-26',
      maxParticipants: 120,
      currentRegistrations: 42,
      eligibility: 'Open to all engineering and technology undergraduate students',
      rules: [
        'Teams must consist of 2 to 4 members.',
        'All code, models, and prototypes must be developed during the hackathon period.',
        'Use of open-source frameworks and pre-trained foundation models is permitted with attribution.',
        'Teams must submit working GitHub repositories and demonstrate live prototypes during jury evaluation.',
      ],
      schedule: [
        { time: '09:00 AM', title: 'Opening Ceremony & Track Release', description: 'Problem statements unlocked and judging criteria overview.' },
        { time: '01:00 PM', title: 'Architecture Checkpoint 1', description: 'Technical design mentoring with industry leads.' },
        { time: '08:00 PM', title: 'Midnight Review & Pitch Practice', description: 'Dry run presentations and debugging assistance.' },
        { time: '06:00 PM', title: 'Final Pitching & Award Ceremony', description: 'Top 10 finalist demos before grand jury.' },
      ],
      bannerUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80',
      customFields: [
        { label: 'GitHub Profile Link', fieldType: 'url', required: true },
        { label: 'Experience Track', fieldType: 'select', required: true, options: ['Generative AI', 'Full-Stack Web3', 'IoT & Smart Hardware'] },
        { label: 'Team Name', fieldType: 'text', required: true },
      ],
      contactInfo: { name: 'Dr. K. Anita', phone: '+91 94441 22334', email: 'cse.organizer@srmeaswari.ac.in' },
      status: 'open',
      registrationType: 'team_only',
      minTeamSize: 2,
      maxTeamSize: 4,
      eligibilityType: 'open_to_all',
      currentRoundNumber: 1,
      prizes: [
        { rank: '1st Place', cashAmount: 100000, perks: 'Direct Internship Offer + Winner Trophy' },
        { rank: '2nd Place', cashAmount: 50000, perks: 'Cloud Credits + Runner-up Trophy' },
        { rank: '3rd Place', cashAmount: 25000, perks: 'Swag Kits + Certificates of Excellence' },
      ],
      rounds: [
        {
          roundNumber: 1,
          title: 'Idea Abstract & Architecture Deck',
          type: 'idea_submission',
          description: 'Submit problem statement formulation, proposed system architecture, and tech stack blueprint.',
          startDate: new Date('2026-10-15'),
          endDate: new Date('2026-10-22'),
          submissionDeadline: new Date('2026-10-21'),
          submissionConfig: {
            allowFileUpload: true,
            allowedFileTypes: ['.pdf', '.pptx'],
            requireGithubUrl: false,
            requireDemoUrl: false,
          },
          isElimination: true,
          status: 'live',
        },
        {
          roundNumber: 2,
          title: 'Prototype Implementation & GitHub Repo',
          type: 'code_repo',
          description: 'Build working prototype with live API integrations and push clean commits to GitHub.',
          startDate: new Date('2026-10-23'),
          endDate: new Date('2026-10-26'),
          submissionDeadline: new Date('2026-10-25'),
          submissionConfig: {
            allowFileUpload: false,
            requireGithubUrl: true,
            requireDemoUrl: true,
          },
          isElimination: true,
          status: 'upcoming',
        },
        {
          roundNumber: 3,
          title: 'Grand Finale & Live Jury Pitch',
          type: 'presentation',
          description: 'Top 10 shortlisted finalists pitch live before senior architects and venture leads.',
          startDate: new Date('2026-10-28'),
          endDate: new Date('2026-10-28'),
          submissionDeadline: new Date('2026-10-28'),
          submissionConfig: {
            allowFileUpload: true,
            requireGithubUrl: true,
            requireDemoUrl: true,
          },
          isElimination: false,
          status: 'upcoming',
        },
      ],
    },
    {
      title: 'Vibrance 2026: Annual Inter-Collegiate Cultural Extravaganza',
      slug: 'vibrance-2026-cultural-extravaganza',
      category: 'Cultural',
      description:
        'The marquee annual campus cultural festival featuring high-voltage Battle of the Bands, Western & Classical Fusion Dance Showdowns, Theatrics, and an electrifying celebrity musical concert under the stars.',
      deptCode: 'CSD',
      venueCode: 'OAT-CAMPUS',
      date: '2026-11-04',
      startTime: '15:00',
      endTime: '22:30',
      registrationDeadline: '2026-11-02',
      maxParticipants: 800,
      currentRegistrations: 340,
      eligibility: 'Open to all enrolled university students with valid college ID',
      rules: [
        'Valid physical student ID card mandatory for festival badge issuance.',
        'Team dance performances have an 8-minute maximum time limit.',
        'Soundtracks must be submitted to the console in MP3 format 2 hours prior to stage calls.',
      ],
      schedule: [
        { time: '03:00 PM', title: 'Acoustic & Solo Vocals Prelims', description: 'Unplugged musical auditions on acoustic stage.' },
        { time: '05:30 PM', title: 'Choreo Night & Fusion Dance', description: 'Inter-department group dance championship.' },
        { time: '08:30 PM', title: 'Celebrity Band Live Concert', description: 'Grand festival concert at the open-air amphitheatre.' },
      ],
      bannerUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80',
      customFields: [
        { label: 'Performance Category', fieldType: 'select', required: true, options: ['Group Dance', 'Battle of Bands', 'Fashion Walk', 'Solo Vocals'] },
        { label: 'Track Title & Duration', fieldType: 'text', required: false },
      ],
      contactInfo: { name: 'Prof. S. Meenakshi', phone: '+91 94441 44556', email: 'csd.organizer@srmeaswari.ac.in' },
      status: 'open',
    },
    {
      title: 'RoboClash: Autonomous Robot Obstacle & Combat Championship',
      slug: 'roboclash-autonomous-robotics-championship',
      category: 'Competition',
      description:
        'Engineers and robotics enthusiasts design and pilot custom robots across high-speed autonomous maze tracking, precision obstacle navigation, and 5kg heavyweight combat battles inside our armored arena.',
      deptCode: 'RA',
      venueCode: 'ROB-MAKER-01',
      date: '2026-11-12',
      startTime: '10:00',
      endTime: '17:00',
      registrationDeadline: '2026-11-10',
      maxParticipants: 80,
      currentRegistrations: 31,
      eligibility: 'Open to undergraduate and polytechnic engineering teams',
      rules: [
        'Bot weight strictly capped at 5.0 kg (+/- 2% tolerance).',
        'Maximum power source rating 24V DC.',
        'Robots must pass fail-safe wireless tether inspection before entering arena.',
      ],
      schedule: [
        { time: '10:00 AM', title: 'Technical Scrutiny & Weigh-in', description: 'Safety inspection, dimension verification, and transmitter check.' },
        { time: '11:30 AM', title: 'Autonomous Line-Follower & Maze Heats', description: 'Timed autonomous course runs.' },
        { time: '02:30 PM', title: 'Armored Arena Combat Knockouts', description: 'Head-to-head robot clashes inside the safety ring.' },
      ],
      bannerUrl: 'https://images.unsplash.com/photo-1517055729445-fa7d27394b48?auto=format&fit=crop&w=1200&q=80',
      customFields: [
        { label: 'Bot Name', fieldType: 'text', required: true },
        { label: 'Robot Weight (kg)', fieldType: 'number', required: true },
        { label: 'Drive Mechanism', fieldType: 'select', required: true, options: ['Differential Drive', 'Omni / Mecanum', 'Tracked / Tank'] },
      ],
      contactInfo: { name: 'Dr. G. Karthik', phone: '+91 94441 66778', email: 'ra.organizer@srmeaswari.ac.in' },
      status: 'open',
    },
    {
      title: 'Quantum & Edge AI Masterclass: TensorRT & Qiskit Hands-on Lab',
      slug: 'quantum-edge-ai-masterclass-2026',
      category: 'Workshop',
      description:
        'An intensive full-day masterclass exploring practical quantum computing algorithms with IBM Qiskit, paired with edge AI model pruning, quantization, and real-time GPU deployment with NVIDIA TensorRT.',
      deptCode: 'AIML',
      venueCode: 'SEM-HALL-A',
      date: '2026-11-18',
      startTime: '09:30',
      endTime: '16:30',
      registrationDeadline: '2026-11-16',
      maxParticipants: 100,
      currentRegistrations: 68,
      eligibility: 'Students with working knowledge of Python and basic linear algebra',
      rules: [
        'Participants must bring a laptop with Python 3.10+ installed.',
        'Lab notebooks and cloud GPU compute credits provided free of charge.',
        '100% attendance required to receive verified completion certificate.',
      ],
      schedule: [
        { time: '09:30 AM', title: 'Quantum Gates, Superposition & Entanglement', description: 'Theoretical foundations and Qiskit circuit setup.' },
        { time: '11:30 AM', title: 'Hands-on Lab 1: Shor & Grover Algorithms', description: 'Executing quantum circuits on IBM Quantum simulators.' },
        { time: '02:00 PM', title: 'Hands-on Lab 2: TensorRT Edge Quantization', description: 'Compressing YOLO and transformer models for Jetson Nano.' },
      ],
      bannerUrl: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=1200&q=80',
      customFields: [
        { label: 'Programming Experience (Years)', fieldType: 'number', required: true },
        { label: 'OS of Laptop', fieldType: 'select', required: true, options: ['Linux / Ubuntu', 'macOS', 'Windows 11 (WSL2)'] },
      ],
      contactInfo: { name: 'Dr. R. Vignesh', phone: '+91 94441 33445', email: 'aiml.organizer@srmeaswari.ac.in' },
      status: 'open',
    },
    {
      title: 'Inter-Departmental Floodlight Cricket & Futsal Trophy 2026',
      slug: 'inter-departmental-cricket-futsal-trophy-2026',
      category: 'Sports',
      description:
        'The biggest sporting clash of the semester! 15 academic departments battle for the coveted Chancellor Cup in 8-over fast-pitch turf cricket and 5-a-side futsal under stadium floodlights.',
      deptCode: 'MECH',
      venueCode: 'SPT-CMPLX',
      date: '2026-11-22',
      startTime: '08:00',
      endTime: '19:00',
      registrationDeadline: '2026-11-19',
      maxParticipants: 300,
      currentRegistrations: 145,
      eligibility: 'Department teams nominated by faculty sports advisors',
      rules: [
        'Team jerseys with numbers required for all players on the pitch.',
        'Standard ICC T8 rules and FIFA Futsal turf guidelines apply.',
        'Referee and umpire rulings are final and binding.',
      ],
      schedule: [
        { time: '08:00 AM', title: 'Grand March Past & Opening Toss', description: 'Athletic salute and preliminary match draw.' },
        { time: '09:00 AM', title: 'Futsal League Stage Matches', description: 'Fast-paced turf rounds across 4 pitches.' },
        { time: '02:00 PM', title: 'Cricket Semi-Finals & Final Clash', description: 'Championship game followed by trophy presentation.' },
      ],
      bannerUrl: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80',
      customFields: [
        { label: 'Selected Sport', fieldType: 'select', required: true, options: ['Floodlight Cricket (T8)', '5-a-Side Futsal', 'Both'] },
        { label: 'Player Position / Role', fieldType: 'text', required: true },
      ],
      contactInfo: { name: 'Dr. P. Ramesh', phone: '+91 94441 55667', email: 'mech.organizer@srmeaswari.ac.in' },
      status: 'open',
    },
    {
      title: 'BioDesign & MedTech Innovation Summit: Healthcare 4.0',
      slug: 'biodesign-medtech-innovation-summit-2026',
      category: 'Innovation',
      description:
        'National conference and project exposition uniting biomedical engineers, clinicians, and health-tech incubators. Showcasing wearable biosensors, non-invasive diagnostic devices, and AI-guided patient monitoring prototypes.',
      deptCode: 'BME',
      venueCode: 'AUD-MAIN',
      date: '2026-12-02',
      startTime: '09:30',
      endTime: '17:00',
      registrationDeadline: '2026-11-29',
      maxParticipants: 250,
      currentRegistrations: 89,
      eligibility: 'Open to engineering, medical, and biotechnology researchers and students',
      rules: [
        'Posters must adhere to standard IEEE A1 portrait dimension.',
        'Hardware prototypes must satisfy standard clinical electrical safety norms.',
      ],
      schedule: [
        { time: '09:30 AM', title: 'Inaugural Keynote: AI in Clinical Diagnostics', description: 'Address by Chief Medical Officer of Apollo Hospitals.' },
        { time: '11:30 AM', title: 'MedTech Seed Pitch Competition', description: 'Top 12 student prototypes pitched to venture funds.' },
        { time: '03:00 PM', title: 'Prototype Expo & Clinical Networking', description: 'Interactive device demonstrations.' },
      ],
      bannerUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80',
      customFields: [
        { label: 'Submission Type', fieldType: 'select', required: true, options: ['Prototype Expo', 'Poster Presentation', 'General Attendee'] },
        { label: 'Project Title (if presenting)', fieldType: 'text', required: false },
      ],
      contactInfo: { name: 'Dr. V. Deepa', phone: '+91 94441 77889', email: 'bme.organizer@srmeaswari.ac.in' },
      status: 'open',
    },
    {
      title: 'Zero-Day Cyber Defense & Red Team Capture The Flag (CTF)',
      slug: 'zero-day-cyber-defense-capture-the-flag-2026',
      category: 'Technical',
      description:
        'Live collegiate jeopardy-style and attack-defense Capture The Flag competition. Test your skills in binary reverse engineering, memory corruption, web exploitation, zero-day threat analysis, and cryptographic deciphering.',
      deptCode: 'CYBER',
      venueCode: 'INV-LAB-01',
      date: '2026-12-08',
      startTime: '10:00',
      endTime: '18:00',
      registrationDeadline: '2026-12-06',
      maxParticipants: 100,
      currentRegistrations: 53,
      eligibility: 'Solo or duo participation open to all enrolled students',
      rules: [
        'Attacks on scoring servers or event infrastructure are strictly forbidden.',
        'Flag sharing or collusion between teams leads to instant disqualification.',
        'Bring your own laptop with security distribution (Kali Linux, Parrot OS, etc.).',
      ],
      schedule: [
        { time: '10:00 AM', title: 'Rules Briefing & CTF Servers Live', description: 'Challenges unlocked across Web, Pwn, Crypto, and Forensics.' },
        { time: '01:30 PM', title: 'First Blood & Hint Drops', description: 'Bonus points awarded for first solves.' },
        { time: '05:00 PM', title: 'Scoreboard Freeze & Write-up Defense', description: 'Top 3 teams present technical exploit walkthroughs.' },
      ],
      bannerUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80',
      customFields: [
        { label: 'Handle / Hacker Alias', fieldType: 'text', required: true },
        { label: 'Primary Specialization', fieldType: 'select', required: true, options: ['Binary Exploitation', 'Web Vulnerabilities', 'Cryptography', 'Digital Forensics'] },
      ],
      contactInfo: { name: 'Dr. M. Arvind', phone: '+91 94441 88990', email: 'cyber.organizer@srmeaswari.ac.in' },
      status: 'open',
    },
    {
      title: 'Campus Spotlight: Student Short Cinema & VFX Film Festival',
      slug: 'campus-spotlight-student-short-cinema-vfx-2026',
      category: 'Arts',
      description:
        'Celebrating the craft of student visual storytelling! Screenings of fiction shorts, social documentaries, 3D animations, and experimental CGI followed by Q&A with acclaimed indie filmmakers and awards.',
      deptCode: 'CSD',
      venueCode: 'MED-STD-02',
      date: '2026-12-14',
      startTime: '11:00',
      endTime: '18:00',
      registrationDeadline: '2026-12-12',
      maxParticipants: 60,
      currentRegistrations: 27,
      eligibility: 'Student filmmakers, editors, animators, and cinema lovers',
      rules: [
        'Total film running time between 3 and 12 minutes.',
        'Subtitles in English are mandatory for all entries.',
        'All soundtrack and background audio must be original or licensed.',
      ],
      schedule: [
        { time: '11:00 AM', title: 'Curated Screenings: Fiction & Animation', description: 'Screenings inside the 4K surround sound media studio.' },
        { time: '02:30 PM', title: 'Directors & VFX Artist Masterclass', description: 'Interactive panel with guest cinematographers.' },
        { time: '04:30 PM', title: 'Golden Clapperboard Awards Ceremony', description: 'Trophy presentation for Best Direction, Editing, and Sound Design.' },
      ],
      bannerUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80',
      customFields: [
        { label: 'Film Title', fieldType: 'text', required: true },
        { label: 'Genre', fieldType: 'select', required: true, options: ['Fiction / Drama', 'Documentary', 'Animation / VFX', 'Experimental'] },
        { label: 'Screening Link (Vimeo / YouTube unlisted)', fieldType: 'url', required: false },
      ],
      contactInfo: { name: 'Prof. S. Meenakshi', phone: '+91 94441 44556', email: 'csd.organizer@srmeaswari.ac.in' },
      status: 'open',
    },
  ];

  let addedCount = 0;
  let updatedCount = 0;

  for (const item of newEventsData) {
    const orgData = organizerMap[item.deptCode];
    if (!orgData) {
      console.warn(`[Seed] Organizer not found for dept ${item.deptCode}`);
      continue;
    }

    const venue = getVenue(item.venueCode);
    if (!venue) {
      console.warn(`[Seed] Venue not found: ${item.venueCode}`);
      continue;
    }

    const payload = {
      title: item.title,
      slug: item.slug,
      category: item.category,
      description: item.description,
      organizerId: orgData.user._id,
      organizerName: orgData.user.name,
      departmentId: orgData.dept._id,
      departmentName: orgData.dept.name,
      departmentCode: orgData.dept.code,
      venueId: venue._id,
      date: item.date,
      startTime: item.startTime,
      endTime: item.endTime,
      registrationDeadline: item.registrationDeadline,
      maxParticipants: item.maxParticipants,
      currentRegistrations: item.currentRegistrations,
      eligibility: item.eligibility,
      rules: item.rules,
      schedule: item.schedule,
      contactInfo: item.contactInfo,
      bannerUrl: item.bannerUrl,
      customFields: item.customFields,
      status: item.status,
      registrationType: item.registrationType || 'both',
      minTeamSize: item.minTeamSize || 1,
      maxTeamSize: item.maxTeamSize || 4,
      eligibilityType: item.eligibilityType || 'open_to_all',
      rounds: item.rounds || [],
      currentRoundNumber: item.currentRoundNumber || 1,
      prizes: item.prizes || [],
    };

    const existing = await Event.findOne({ slug: item.slug });
    if (!existing) {
      await Event.create(payload);
      addedCount++;
      console.log(`  + Created: ${item.title} (${item.date})`);
    } else {
      await Event.updateOne({ slug: item.slug }, { $set: payload });
      updatedCount++;
      console.log(`  ~ Updated: ${item.title} (${item.date})`);
    }
  }

  console.log(`[Seed] Successfully processed sample events: ${addedCount} added, ${updatedCount} updated.`);
};

// If executed directly from CLI
if (process.argv[1]?.endsWith('seedEvents.js')) {
  import('dotenv').then(async (dotenv) => {
    dotenv.config();
    const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/eventbridge';
    await mongoose.connect(uri);
    await seedSampleEvents();
    await mongoose.disconnect();
    console.log('[Seed] Disconnected from DB.');
    process.exit(0);
  });
}
