import mongoose from 'mongoose';
import User from './server/models/userModel.js';

async function assignStudent() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/school_system';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Use the TYBCA class ID directly (confirmed from DB: 6912f2f85fe3ee295908d035)
    const classId = '6912f2f85fe3ee295908d035';

    // Find the student
    const student = await User.findOne({ username: 'shekhar', role: 'student' });
    if (!student) {
      console.error('❌ Student not found: shekhar');
      process.exit(1);
    }
    console.log(`Found student: ${student.name} (ID: ${student._id})`);

    // Assign student to class
    student.classId = classId;
    await student.save();
    console.log(`✅ Assigned student '${student.username}' to class TYBCA`);
    console.log(`   classId: ${student.classId}`);

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

assignStudent();
