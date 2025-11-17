import cors from 'cors';
import type { Application } from 'express';

export const useCors = (app: Application) => {
  const origins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim())
    : [];

  app.use(
    cors({
      origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (origins.indexOf(origin) === -1) {
          const msg =
            `The CORS policy for this site does not ` +
            `allow access from the specified Origin: ${origin}.`;
          return callback(new Error(msg), false);
        }
        return callback(null, true);
      },
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
      allowedHeaders: ['Content-Type', 'Authorization'], // Allowed headers
      credentials: true, // Allow credentials (cookies, authorization headers, etc.)
      optionsSuccessStatus: 204, // For legacy browser support
    }),
  );
};
