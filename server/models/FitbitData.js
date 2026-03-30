const mongoose = require('mongoose');

const FitbitDataSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  accessToken: {
    type: String,
  },
  refreshToken: {
    type: String,
  },
  lastSync: {
    type: Date,
  },
  heartRateLogs: [{
    time: String,
    value: Number
  }]
});

module.exports = mongoose.model('FitbitData', FitbitDataSchema);
