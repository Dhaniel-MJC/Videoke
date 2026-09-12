import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createClient } from 'redis';
import { createAdapter } from '@socket.io/redis-adapter';
import pool from './db/client';
import authRoutes from './routes/auth';
import roomRoutes from './routes/rooms';
import performanceRoutes from './routes/performances';
// Phase 4: YouTube Integration
import songsRoutes from './routes/songs';
import playlistsRoutes from './routes/playlists';
import favoritesRoutes from './routes/favorites';
import { setupWebSocketHandlers } from './handlers/websocket';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/performances', performanceRoutes);

// Phase 4: YouTube Integration Routes
app.use('/api/songs', songsRoutes);
app.use('/api/playlists', playlistsRoutes);

// Users Routes (Favorites + Performances + Stats)
import usersRoutes from './routes/users';
app.use('/api/users', usersRoutes);

// Legacy: Keep favorites routes for backward compatibility
app.use('/api/users', favoritesRoutes);

// Socket.IO configuration
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  },
});

// Redis adapter for Socket.IO (for multi-instance deployment)
async function setupRedisAdapter() {
  try {
    const pubClient = createClient({ url: process.env.REDIS_URL || 'redis://redis:6379' });
    const subClient = pubClient.duplicate();

    await Promise.all([pubClient.connect(), subClient.connect()]);
    io.adapter(createAdapter(pubClient, subClient));

    console.log('Redis adapter connected');
  } catch (error) {
    console.error('Redis adapter error:', error);
    console.log('Continuing without Redis adapter (single instance mode)');
  }
}

// Setup WebSocket handlers
setupWebSocketHandlers(io);

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    status: err.status || 500,
  });
});

// Database connection test
async function testDatabaseConnection() {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('Database connected:', result.rows[0]);
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
}

// Start server
async function start() {
  await testDatabaseConnection();
  await setupRedisAdapter();

  httpServer.listen(PORT, () => {
    console.log(`🎤 Videoke server running on port ${PORT} (${NODE_ENV})`);
  });
}

start().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

export { app, io };
