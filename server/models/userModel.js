import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String },
  phone: { type: String },
  // Optional fields for teachers/students
  subjectId: { type: String },
  experience: { type: String },
  // Student-specific fields
  rollNumber: { type: String },
  classId: { type: String },
  // Attendance records for students
  attendance: [{
    date: { type: Date },
    classId: { type: String },
    subjectId: { type: String },
    status: { type: String, enum: ['Present', 'Absent', 'Leave'], default: 'Present' },
    markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],
  // Encrypted plaintext password copy (optional) - stores encrypted admin-provided password so admin
  // can view the credentials later. This is stored encrypted with a server-side key.
  plainPasswordEncrypted: {
    iv: { type: String },
    content: { type: String },
    tag: { type: String }
  }
});

export default mongoose.model("User", userSchema);
