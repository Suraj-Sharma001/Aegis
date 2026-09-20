import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';

import authRoutes from './routes/auth.routes.js';
import applicationRoutes from './routes/application.routes.js';
import gatewayRoutes from './routes/gateway.routes.js';
import providerKeyRoutes from './routes/providerKey.routes.js';
import teamRoutes from './routes/team.routes.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: '2mb' }));
  app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined'));

  app.get('/health', (req, res) => res.json({ status: 'ok', service: 'aegis-gateway' }));

  app.use('/auth', authRoutes);
  app.use('/applications', applicationRoutes);
  app.use('/provider-keys', providerKeyRoutes);
  app.use('/teams', teamRoutes);
  app.use('/v1', gatewayRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
