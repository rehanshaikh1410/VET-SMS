import mongoose from 'mongoose';
import User from './server/models/userModel.js';
import Timetable from './server/models/timetableModel.js';
import Class from './server/models/classModel.ts';

async function debugStudentTimetable() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/school_system';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Find a student
    const student = await User.findOne({ role: 'student' });
    if (!student) {
      console.log('❌ No student found in database');
      await mongoose.disconnect();
      process.exit(1);
    }

    console.log('Student found:');
    console.log(`  Username: ${student.username}`);
    console.log(`  Name: ${student.name}`);
    console.log(`  ClassId: ${student.classId || 'NOT SET'}`);
    console.log(`  Email: ${student.email}`);
    console.log('');

    if (!student.classId) {
      console.error('❌ Student has no classId assigned');
      await mongoose.disconnect();
      process.exit(1);
    }

    // Find the class
    const classRecord = await Class.findById(student.classId);
    console.log('Class found:');
    console.log(`  ID: ${classRecord?._id}`);
    console.log(`  Name: ${classRecord?.name}`);
    console.log('');

    // Find timetable for this class
    const timetable = await Timetable.findOne({ classId: student.classId });
    if (!timetable) {
      console.log('❌ No timetable found for this class');
      await mongoose.disconnect();
      process.exit(1);
    }

    console.log('✅ Timetable found:');
    console.log(`  ClassId: ${timetable.classId}`);
    console.log(`  Total Entries: ${timetable.entries?.length || 0}`);
    if (timetable.entries && timetable.entries.length > 0) {
      console.log('\n  First 5 entries:');
      timetable.entries.slice(0, 5).forEach((entry, idx) => {
        console.log(`    ${idx + 1}. Day: ${entry.day}, Period: ${entry.period}, Time: ${entry.time}, SubjectId: ${entry.subjectId}`);
      });
    }

    console.log('\n✅ All data is correct in database!');
    console.log('Issue must be in the API endpoint or frontend request.\n');

    await mongoose.disconnect();
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

debugStudentTimetable();
