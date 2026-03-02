import app from '../src/app';

export default function handler(req: any, res: any) {
  console.log('API Request:', req.method, req.url);
  // Vercel serverless function handler
  return app(req, res);
}
