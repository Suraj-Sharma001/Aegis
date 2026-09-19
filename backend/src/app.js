import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';

import authRoutes from './routes/auth.routes.js';
import applicationRoutes from './routes/application.routes.js';
import gatewayRoutes from './routes/gateway.routes.js';
import providerKeyRoutes from './routes/providerKey.routes.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: '2mb' }));
  app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined'));

  app.get('/health', (req, res) => res.json({ status: 'ok', service: 'aegis-gateway' }));

  // /auth          -> dashboard login/register (JWT)
  // /applications  -> dashboard-managed apps + API key issuance (JWT)
  // /provider-keys -> org-owned LLM provider credentials, BYOK (JWT)
  // /v1            -> the actual AI gateway, called by client apps (x-api-key)
  app.use('/auth', authRoutes);
  app.use('/applications', applicationRoutes);
  app.use('/provider-keys', providerKeyRoutes);
  app.use('/v1', gatewayRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
