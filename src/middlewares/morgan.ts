import type { Application } from 'express';
import morgan from 'morgan';

export const useMorgan = (app: Application) => {
  if (
    process.env.NODE_ENV === 'development' ||
    process.env.NODE_ENV === 'test'
  ) {
    app.use(morgan('dev'));
  }
};
