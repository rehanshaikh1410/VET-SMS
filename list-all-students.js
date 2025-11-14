import mongoose from 'mongoose';
import User from './server/models/userModel.js';

async function listAllStudents() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/school_system';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    const students = await User.find({ role: 'student' });
    console.log(`Found ${students.length} students:\n`);
    
    students.forEach((s, idx) => {
      console.log(`${idx + 1}. Username: ${s.username}`);
      console.log(`   Name: ${s.name}`);
      console.log(`   ClassId: ${s.classId || 'NOT SET'}`);
      console.log(`   Email: ${s.email || 'NOT SET'}`);
      console.log('');
    });

    await mongoose.disconnect();
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

listAllStudents();
