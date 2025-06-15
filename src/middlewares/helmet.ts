import helmet from 'helmet';
import type { Application } from 'express';

export const useHelmet = (app: Application) => {
  app.use(helmet());
};
