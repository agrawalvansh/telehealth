import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { setupSwagger } from './swagger';
import { initSocket } from './config/socket';
import { startCleanupTask } from './scripts/cleanup';

// Import routes
import authRoutes from './routes/auth';
import patientRoutes from './routes/patients';
import doctorRoutes from './routes/doctors';
import appointmentRoutes from './routes/appointments';
import adminRoutes from './routes/admin';
import videoRoutes from './routes/video';
import healthArticlesRoutes from './routes/healthArticles';
import searchRoutes from './routes/search';

// Load environment variables
dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = initSocket(httpServer);
const PORT = process.env.PORT || 5000;

// Middleware
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000')
  .split(',')
  .map(url => url.trim());

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(null, false);
  },
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/video', videoRoutes);
app.use('/api/health-articles', healthArticlesRoutes);
app.use('/api/search', searchRoutes);

// Swagger Documentation
setupSwagger(app);

// Start server
httpServer.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🏥  Telehealth System API Server                       ║
║                                                           ║
║   🚀  Server running on port ${PORT}                        ║
║   📡  API: http://localhost:${PORT}                        ║
║   📚  Docs: http://localhost:${PORT}/api-docs              ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);

  // Start background tasks
  startCleanupTask();
});

export default app;
