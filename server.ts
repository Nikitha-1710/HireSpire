import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { db, initDatabase } from './server/db.js';
import { seedDatabase } from './server/seed.js';
import { apiRouter } from './server/api.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
// Port 3000 required by runtime environment constraints
const PORT = 3000;

// Body parser with 10MB limit for resume uploads
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Initialize SQLite database and seed initial data
initDatabase();
seedDatabase();

// Mount API routes
app.use('/api', apiRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'HR Recruitment Management System', timestamp: new Date().toISOString() });
});

// Flush SQLite database on termination so user registrations and jobs never lose data
function flushDatabase() {
  try {
    db.exec('PRAGMA wal_checkpoint(FULL);');
  } catch (e) {
    console.error('Error flushing DB:', e);
  }
}

process.on('SIGINT', () => {
  flushDatabase();
  process.exit(0);
});

process.on('SIGTERM', () => {
  flushDatabase();
  process.exit(0);
});

process.on('beforeExit', () => {
  flushDatabase();
});

async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production static serving
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`HR Recruitment Management System running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
