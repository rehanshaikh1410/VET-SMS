import mongoose from 'mongoose';
import ClassModel from './server/models/classModel.ts';

async function listClasses() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/school_system';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    const classes = await ClassModel.find({});
    console.log(`Found ${classes.length} classes:`);
    classes.forEach(c => {
      console.log(`  - ID: ${c._id}, Name: "${c.name}"`);
    });

    await mongoose.disconnect();
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

listClasses();
