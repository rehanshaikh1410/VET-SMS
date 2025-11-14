import mongoose from 'mongoose';
import Timetable from './server/models/timetableModel.js';

async function listTimetables() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/school_system';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    const timetables = await Timetable.find({});
    console.log(`Found ${timetables.length} timetables:`);
    timetables.forEach(t => {
      console.log(`  - Class ID: ${t.classId}, Entries: ${t.entries ? t.entries.length : 0}`);
    });

    await mongoose.disconnect();
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

listTimetables();
