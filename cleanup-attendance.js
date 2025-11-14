import mongoose from 'mongoose';
import User from './server/models/userModel.js';
import Subject from './server/models/subjectModel.js';
import 'dotenv/config';

async function cleanupAttendance() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/school_system');
    console.log('✅ Connected to MongoDB');

    // Get all valid subject IDs
    const validSubjects = await Subject.find({}).select('_id');
    const validSubjectIds = new Set(validSubjects.map(s => s._id.toString()));
    
    console.log(`Found ${validSubjectIds.size} valid subjects`);

    // Find all students with attendance records
    const students = await User.find({ role: 'student' });
    console.log(`Found ${students.length} students`);

    let totalRecordsRemoved = 0;
    let studentUpdatedCount = 0;

    // For each student, remove attendance records with invalid subject IDs
    for (const student of students) {
      if (student.attendance && student.attendance.length > 0) {
        const originalCount = student.attendance.length;
        
        // Filter out records with invalid subject IDs
        student.attendance = student.attendance.filter((record) => {
          if (!record.subjectId) {
            // Keep records without subject ID
            return true;
          }
          const isValid = validSubjectIds.has(record.subjectId.toString());
          if (!isValid) {
            console.log(`  Removing invalid record: ${record.date} - Subject ID: ${record.subjectId}`);
          }
          return isValid;
        });

        const removedCount = originalCount - student.attendance.length;
        if (removedCount > 0) {
          await student.save();
          totalRecordsRemoved += removedCount;
          studentUpdatedCount++;
          console.log(`  Student ${student.username}: Removed ${removedCount} invalid attendance records`);
        }
      }
    }

    console.log(`\n✅ Cleanup Complete!`);
    console.log(`   - Students updated: ${studentUpdatedCount}`);
    console.log(`   - Total records removed: ${totalRecordsRemoved}`);

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  }
}

cleanupAttendance();
