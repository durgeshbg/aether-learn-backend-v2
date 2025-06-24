import express from 'express';
import { useCors } from '../middlewares/cors';
import { useMorgan } from '../middlewares/morgan';
import { useHelmet } from '../middlewares/helmet';
import { useRateLimit } from '../middlewares/rateLimit';
import { useCompression } from '../middlewares/compression';
import { useJsonParse } from '../middlewares/jsonParse';
import { useSwagger } from '../middlewares/swagger';
import indexRouter from './indexRouter';

export default function setupApp() {
  const app = express();

  useCors(app);
  useHelmet(app);
  useMorgan(app);
  useJsonParse(app);
  useRateLimit(app);
  useCompression(app);
  useSwagger(app);

  app.get('/health-check', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Server is healthy' });
  });

  app.use('/api/v1', indexRouter);

  return app;
}
