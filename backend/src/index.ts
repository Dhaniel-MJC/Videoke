import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { Pool } from 'pg';
import redis from 'redis';
import { createAdapter } from 'socket.io-redis';

dotenv.config();

// Inicializar Express
const app = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
  }
});

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Pool de conexão PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Configurar Redis para Socket.IO
const redisClient = redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    reconnectStrategy: (retries) => Math.min(retries * 50, 500)
  }
});

let redisConnected = false;
redisClient.on('connect', () => {
  redisConnected = true;
  console.log('Redis connected');
});

redisClient.on('error', (err) => {
  console.error('Redis error:', err);
  redisConnected = false;
});

// Conectar Redis sem bloquear
redisClient.connect().catch(err => {
  console.error('Redis initial connection failed (will retry):', err.message);
});

// Configurar Socket.IO adapter se Redis conectar
if (redisConnected) {
  const pubClient = redisClient.duplicate();
  pubClient.connect().catch(err => console.error('Redis pub connection failed:', err));
  io.adapter(createAdapter(pubClient, pubClient));
}

// Testar conexão com banco (sem bloquear)
pool.query('SELECT NOW()').then(result => {
  console.log('Database connected:', result.rows[0]);
}).catch(err => {
  console.error('Database connection failed:', err.message);
});

// Rotas básicas
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    redis: redisConnected,
    environment: process.env.NODE_ENV
  });
});

app.get('/api/songs', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM songs LIMIT 10');
    res.json(result.rows);
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Socket.IO events
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });

  socket.on('start_recording', (data) => {
    socket.broadcast.emit('user_recording', {
      userId: socket.id,
      songId: data.songId
    });
  });

  socket.on('audio_chunk', (data) => {
    socket.broadcast.emit('audio_chunk', {
      userId: socket.id,
      chunk: data.chunk
    });
  });
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
