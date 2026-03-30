const mongoose = require('mongoose');

const uri = 'mongodb://127.0.0.1:27017/emotional_energy';

console.log('Attempting to connect to:', uri);

mongoose.connect(uri)
  .then(() => {
    console.log('Successfully connected to MongoDB');
    process.exit(0);
  })
  .catch(err => {
    console.error('Connection error:', err);
    process.exit(1);
  });
