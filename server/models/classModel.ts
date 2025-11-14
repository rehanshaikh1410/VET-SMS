import mongoose from 'mongoose';

export interface IClass {
  name: string;
  grade?: string;
  students?: mongoose.Types.ObjectId[];
  classTeacher?: mongoose.Types.ObjectId | string;
}

const classSchema = new mongoose.Schema<IClass>({
  name: { type: String, required: true },
  grade: { type: String },
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  classTeacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});

const ClassModel = mongoose.model<IClass>('Class', classSchema);
export default ClassModel;
