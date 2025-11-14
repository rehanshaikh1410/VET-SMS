import mongoose from 'mongoose';
import User from './server/models/userModel.js';
import Timetable from './server/models/timetableModel.js';

async function debug() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/school_system';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Find student shekhar
    const student = await User.findOne({ username: 'shekhar' });
    console.log('Student shekhar:');
    console.log(`  _id: ${student._id}`);
    console.log(`  classId: ${student.classId}\n`);

    if (!student.classId) {
      console.error('❌ Student has no classId assigned!');
      await mongoose.disconnect();
      process.exit(1);
    }

    // Find timetable for this class
    const timetable = await Timetable.findOne({ classId: student.classId });
    console.log('Timetable for class:');
    console.log(`  classId: ${timetable?.classId}`);
    console.log(`  entries count: ${timetable?.entries?.length || 0}`);
    console.log(`  entries:`, JSON.stringify(timetable?.entries || [], null, 2));

    await mongoose.disconnect();
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

debug();
