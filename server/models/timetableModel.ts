import mongoose from 'mongoose';

export interface ITimetableEntry {
  day: string;
  period: number;
  subjectId?: string;
  teacherId?: string;
  time?: string;
}

export interface ITimetable {
  classId: string;
  entries: ITimetableEntry[];
  createdAt?: Date;
}

const timetableEntrySchema = new mongoose.Schema<ITimetableEntry>({
  day: { type: String, required: true },
  period: { type: Number, required: true },
  subjectId: { type: String },
  teacherId: { type: String },
  time: { type: String }
});

const timetableSchema = new mongoose.Schema<ITimetable>({
  classId: { type: String, required: true, index: true },
  entries: [timetableEntrySchema],
  createdAt: { type: Date, default: Date.now }
});

const Timetable = mongoose.model<ITimetable>('Timetable', timetableSchema);

export default Timetable;
