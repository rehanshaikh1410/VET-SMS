// server/db.js
import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI || "mongodb://localhost:27017/school_system";
    await mongoose.connect(uri);
    // Log the host and database name so you can confirm which database we connected to
    const { name, host } = mongoose.connection;
    console.log(`✅ MongoDB Connected Successfully! host=${host} db=${name}`);
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error.message);
    process.exit(1);
  }
};

export default connectDB;
