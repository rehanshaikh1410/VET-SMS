import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI || "mongodb://localhost:27017/school_system";
    await mongoose.connect(uri);
    const { name, host } = mongoose.connection;
    console.log(`✅ MongoDB Connected Successfully! host=${host} db=${name}`);
  } catch (error) {
    const err = error as Error;
    console.error("❌ MongoDB Connection Error:", err.message);
    process.exit(1);
  }
};

export default connectDB;
