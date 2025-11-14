import mongoose from 'mongoose';

const timetableEntrySchema = new mongoose.Schema({
  day: { type: String, required: true },
  period: { type: Number, required: true },
  subjectId: { type: String },
  teacherId: { type: String },
  time: { type: String }
});

const timetableSchema = new mongoose.Schema({
  classId: { type: String, required: true, index: true },
  entries: [timetableEntrySchema],
  createdAt: { type: Date, default: Date.now }
});

const Timetable = mongoose.model('Timetable', timetableSchema);

export default Timetable;
