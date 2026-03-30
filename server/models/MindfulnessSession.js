const mongoose = require('mongoose');

const MindfulnessSessionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  duration: {
    type: Number, // in seconds
    required: true,
  },
  moodBefore: String,
  moodAfter: String,
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model('MindfulnessSession', MindfulnessSessionSchema);
