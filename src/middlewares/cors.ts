import cors from 'cors';
import type { Application } from 'express';

export const useCors = (app: Application) => {
  app.use(
    cors({
      origin: process.env.CORS_ORIGIN || '*', // Allow all origins by default, can be configured via environment variable
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Allowed HTTP methods
      allowedHeaders: ['Content-Type', 'Authorization'], // Allowed headers
      credentials: true, // Allow credentials (cookies, authorization headers, etc.)
      optionsSuccessStatus: 204, // For legacy browser support
    })
  );
};
