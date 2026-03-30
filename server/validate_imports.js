const logger = { info: console.log, error: console.error };
const auth = require('./middleware/auth');
console.log('auth middleware type:', typeof auth.auth);

const routes = {
  auth: require('./routes/auth'),
  energy: require('./routes/energy'),
  fitbit: require('./routes/fitbit'),
  habit: require('./routes/habit'),
  analytics: require('./routes/analytics'),
  enterprise: require('./routes/enterprise'),
  ai: require('./routes/ai'),
  mindfulness: require('./routes/mindfulness')
};

for (const [name, router] of Object.entries(routes)) {
  console.log(`${name} router type:`, typeof router);
  if (typeof router !== 'function') {
    console.error(`ERROR: ${name} router is not a function!`);
  }
}
