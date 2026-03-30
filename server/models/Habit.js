const mongoose = require('mongoose');

const HabitSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  logs: [{
    date: { type: Date, default: Date.now },
    value: Number, // e.g., hours of sleep, cups of coffee
    energyAtTime: Number, // captured energy level at habit log time
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model('Habit', HabitSchema);
