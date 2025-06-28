import type { Application } from 'express';
import morgan from 'morgan';

export const useMorgan = (app: Application) => {
  if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
  }
};
