import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import rateLimit from 'express-rate-limit';


// Route imports
import authRoutes from './routes/auth';
import quizRoutes from './routes/quiz';
import adminRoutes from './routes/admin';

dotenv.config();

// Required for Neon Serverless WebSockets
neonConfig.webSocketConstructor = ws;

const app = express();
const PORT = process.env.PORT || 5000;

/**
 * Initialize Prisma 7 with Neon Adapter
 */



// Replace your current initialization with this:
const connectionString = process.env.DATABASE_URL || '';
const pool = new Pool({ connectionString });

// Use 'as any' specifically here to bypass the strict type mismatch 
// between the Neon Pool and the PrismaNeon expected input.
const adapter = new PrismaNeon(pool as any); 
export const prisma = new PrismaClient({ adapter });

// Security & Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));

const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Routes
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/admin', adminRoutes);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' });
});

/**
 * Error handler
 * Explicitly typed to satisfy TS7006 and TS18046
 */
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Error:', err);
  const message = err instanceof Error ? err.message : 'Internal server error';
  res.status(500).json({ error: message });
});

app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
  }
});

export default app;
