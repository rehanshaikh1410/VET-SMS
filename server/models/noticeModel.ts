import mongoose from 'mongoose';

const noticeSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
  audience: { type: String, enum: ['all', 'teachers', 'students'], default: 'all' },
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
});

const Notice = mongoose.model('Notice', noticeSchema);

export default Notice;