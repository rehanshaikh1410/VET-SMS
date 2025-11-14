import mongoose from "mongoose";

export interface IUser {
  username: string;
  password: string;
  role: string;
  name: string;
  email?: string;
  phone?: string;
  subjectId?: string;
  experience?: string;
  rollNumber?: string;
  classId?: string;
  attendance: Array<{
    date?: Date;
    classId?: string;
    subjectId?: string | null;
    status: 'Present' | 'Absent' | 'Leave';
    markedBy?: mongoose.Types.ObjectId | string;
  }>;
  plainPasswordEncrypted?: {
    iv: string;
    content: string;
    tag: string;
  };
}

const userSchema = new mongoose.Schema<IUser>({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String },
  phone: { type: String },
  subjectId: { type: String },
  experience: { type: String },
  rollNumber: { type: String },
  classId: { type: String },
  attendance: [{
    date: { type: Date },
    classId: { type: String },
    subjectId: { type: String },
    status: { type: String, enum: ['Present', 'Absent', 'Leave'], default: 'Present' },
    markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],
  plainPasswordEncrypted: {
    iv: { type: String },
    content: { type: String },
    tag: { type: String }
  }
});

export default mongoose.model<IUser>("User", userSchema);

