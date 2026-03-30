require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const logger = require('./utils/logger');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./utils/swagger');
const path = require('path');

const authRoutes = require('./routes/auth');
const energyRoutes = require('./routes/energy');
const fitbitRoutes = require('./routes/fitbit');
const habitRoutes = require('./routes/habit');
const analyticsRoutes = require('./routes/analytics');
const enterpriseRoutes = require('./routes/enterprise');
const aiRoutes = require('./routes/ai');
const mindfulnessRoutes = require('./routes/mindfulness');

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Attach io to app for use in routes
app.set('socketio', io);

io.on('connection', (socket) => {
  logger.info('New client connected: ' + socket.id);
  socket.on('disconnect', () => logger.info('Client disconnected'));
});

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// Database Connection
const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/emotional_energy';
mongoose.connect(mongoURI)
.then(() => console.log('MongoDB connected successfully'))
.catch(err => console.error('MongoDB connection error:', err));

const { auth: authMiddleware, checkRole } = require('./middleware/auth');

// Routes
app.use('/api/auth', authRoutes);
// Fitbit OAuth routes (/auth /callback) must be PUBLIC - browser redirects don't send cookies cross-origin
app.use('/api/fitbit', fitbitRoutes);
// Secure all other internal endpoints with HttpOnly Cookie verification
app.use('/api/energy', authMiddleware, energyRoutes);
app.use('/api/habit', authMiddleware, habitRoutes);
app.use('/api/analytics', authMiddleware, analyticsRoutes);
app.use('/api/enterprise', authMiddleware, checkRole(['Admin', 'Manager']), enterpriseRoutes);
app.use('/api/ai', authMiddleware, aiRoutes);
app.use('/api/mindfulness', authMiddleware, mindfulnessRoutes);

// Serve Static Files (Frontend)
const distPath = path.resolve(__dirname, '../client/dist');
app.use(express.static(distPath));

// SPA Fallback Middleware
app.use((req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/api-docs')) {
    return next();
  }
  res.sendFile(path.join(distPath, 'index.html'));
});

// Start Server
server.listen(PORT, '0.0.0.0', () => {
  logger.info(`Server running on port ${PORT}`);
});
