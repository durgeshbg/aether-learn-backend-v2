import compression from 'compression';
import type { Application } from 'express';

export const useCompression = (app: Application) => {
  app.use(compression());
};
