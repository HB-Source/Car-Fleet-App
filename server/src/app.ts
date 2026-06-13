import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import { corsOrigins, env } from './config/env.js';
import { authRouter } from './routes/auth.routes.js';
import { usersRouter } from './routes/users.routes.js';
import { vehiclesRouter } from './routes/vehicles.routes.js';
import { healthRouter } from './routes/health.routes.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

export function buildApp() {
  const app = express();

  app.set('trust proxy', 1); // behind Render/Railway/Fly proxies
  app.use(helmet());
  app.use(
    cors({
      origin: corsOrigins,
      methods: ['GET', 'POST', 'PATCH', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }),
  );
  if (env.NODE_ENV !== 'test') {
    app.use(pinoHttp({ autoLogging: { ignore: (req) => req.url === '/api/health' } }));
  }
  app.use(express.json({ limit: '100kb' }));

  app.use('/api/health', healthRouter);
  app.use('/api/auth', authRouter);
  app.use('/api/users', usersRouter);
  app.use('/api/vehicles', vehiclesRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
