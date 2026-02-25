import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import authRoutes from './src/routes/auth';
import userRoutes from './src/routes/users';
import roleRoutes from './src/routes/roles';
import kioskRoutes from './src/routes/kiosks';

import problemTypesRouter from './src/routes/problemTypes';
import visitTypesRouter from './src/routes/visitTypes';
import visitsRouter from './src/routes/visits';
import statsRouter from './src/routes/stats';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.set('trust proxy', 1); // Trust first proxy (nginx)

  app.use(express.json());
  app.use(cookieParser());

  // Serve uploaded files
  app.use('/uploads', express.static('uploads'));

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/roles', roleRoutes);
  app.use('/api/kiosks', kioskRoutes);
  app.use('/api/problem-types', problemTypesRouter);
  app.use('/api/visit-types', visitTypesRouter);
  app.use('/api/visits', visitsRouter);
  app.use('/api/stats', statsRouter);

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
