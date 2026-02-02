import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { connectDb } from './config/db.js';
import convertRouter from './routes/convert.js';
import topProductsRouter from './routes/topProducts.js';

const app = express();

// Basic security & logging
app.use(helmet());
app.use(morgan('dev'));

// CORS - hỗ trợ nhiều origin (phân cách bằng dấu phẩy)
const originEnv = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
const allowedOrigins = originEnv.split(',').map((o) => o.trim()).filter(Boolean);
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      cb(null, false);
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    credentials: true
  })
);

// Body parser
app.use(express.json());

// Rate limiting for /api/convert
const convertLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per window per IP
  message: {
    error: 'Too many requests. Please try again later.'
  },
  keyGenerator: (req) => req.ip
});

app.use('/api/convert', convertLimiter, convertRouter);
app.use('/api/top-products', topProductsRouter);

// Simple health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Global error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || 'Internal server error'
  });
});

const PORT = process.env.PORT || 4000;

async function start() {
  try {
    await connectDb();
    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server', err);
    process.exit(1);
  }
}

start();

