import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import Event from '../models/Event.js';

dotenv.config();

const bannerMappings = [
  { match: /hacknova/i, url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80' },
  { match: /hackathon/i, url: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80' },
  { match: /vibrance/i, url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80' },
  { match: /cultural|music/i, url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80' },
  { match: /roboclash|robot/i, url: 'https://images.unsplash.com/photo-1517055729445-fa7d27394b48?auto=format&fit=crop&w=1200&q=80' },
  { match: /quantum/i, url: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=1200&q=80' },
  { match: /cricket|futsal|football|sports/i, url: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80' },
  { match: /esports/i, url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80' },
  { match: /biodesign|medtech|health/i, url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80' },
  { match: /zero-day|cyber|ctf/i, url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80' },
  { match: /cinema|film|vfx/i, url: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80' },
  { match: /react|node|workshop/i, url: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=1200&q=80' },
  { match: /gdsc|club/i, url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80' },
];

async function updateAllBanners() {
  const connected = await connectDB();
  if (!connected) {
    console.error('Failed to connect to database');
    process.exit(1);
  }

  const events = await Event.find({});
  console.log(`Found ${events.length} events to verify/update banners.`);

  let updated = 0;
  for (const event of events) {
    let newBanner = '';
    for (const mapping of bannerMappings) {
      if (mapping.match.test(event.title) || mapping.match.test(event.category)) {
        newBanner = mapping.url;
        break;
      }
    }
    if (!newBanner) {
      newBanner = 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80';
    }

    if (event.bannerUrl !== newBanner) {
      event.bannerUrl = newBanner;
      await event.save();
      console.log(`✓ Updated [${event.title}]: ${newBanner}`);
      updated++;
    }
  }

  console.log(`Successfully updated ${updated} event banners to verified real web images.`);
  await mongoose.disconnect();
  process.exit(0);
}

updateAllBanners();
