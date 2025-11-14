import mongoose from 'mongoose';

export interface ISubject {
  name: string;
  code?: string;
  teacher?: mongoose.Types.ObjectId | string;
  teachers?: mongoose.Types.ObjectId[];
  classes?: mongoose.Types.ObjectId[];
}

const subjectSchema = new mongoose.Schema<ISubject>({
  name: { type: String, required: true },
  code: { type: String },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  teachers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  classes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Class' }],
});

const Subject = mongoose.model<ISubject>('Subject', subjectSchema);
export default Subject;
