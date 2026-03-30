const deps = [
  'dotenv',
  'express',
  'http',
  'socket.io',
  'mongoose',
  'cors',
  'cookie-parser',
  'morgan',
  './utils/logger',
  'swagger-ui-express',
  './utils/swagger',
  './routes/auth',
  './routes/energy',
  './routes/fitbit',
  './routes/habit',
  './routes/analytics',
  './routes/enterprise',
  './routes/ai',
  './routes/mindfulness',
  'helmet',
  'express-rate-limit',
  'compression'
];

deps.forEach(dep => {
  try {
    console.log(`Checking ${dep}...`);
    require(dep);
    console.log(`  OK`);
  } catch (err) {
    console.error(`  FAILED: ${err.message}`);
    console.error(err.stack);
    process.exit(1);
  }
});
