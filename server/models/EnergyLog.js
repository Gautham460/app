const mongoose = require('mongoose');

const EnergyLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  energyLevel: {
    type: Number,
    required: true,
    min: 1,
    max: 10,
  },
  emotion: {
    type: String,
    required: true,
  },
  notes: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model('EnergyLog', EnergyLogSchema);
