import express from 'express';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import roleRoutes from './routes/roles';
import kioskRoutes from './routes/kiosks';
import problemTypesRouter from './routes/problemTypes';
import visitTypesRouter from './routes/visitTypes';
import visitsRouter from './routes/visits';
import statsRouter from './routes/stats';

const app = express();

app.set('trust proxy', 1); // Trust first proxy (nginx/Vercel)

app.use(express.json());
app.use(cookieParser());

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

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled Error:', err);
  res.status(500).json({ 
    message: 'Internal Server Error', 
    error: process.env.NODE_ENV === 'development' ? err.message : undefined 
  });
});

export default app;
