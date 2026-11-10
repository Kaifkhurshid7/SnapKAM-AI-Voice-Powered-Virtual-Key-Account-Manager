import { existsSync } from 'node:fs';
import path from 'node:path';
import cors from 'cors';
import express, { type Express } from 'express';
import { rateLimit } from 'express-rate-limit';
import helmet from 'helmet';
import { CLIENT_DIST_PATH } from './config/paths.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';
import { chatRoutes } from './routes/chat.routes.js';
import { sellerRoutes } from './routes/seller.routes.js';
import type { ConversationService } from './services/conversation.service.js';
import { diagnose } from './services/diagnosis.service.js';
import type { SellerData } from './types.js';

export interface AppDependencies {
  conversation: ConversationService;
  sellerData: SellerData;
  corsOrigin: string;
}

/** Build the Express app. Dependencies are injected so the app is easy to test. */
export function createApp({ conversation, sellerData, corsOrigin }: AppDependencies): Express {
  const app = express();

  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({ origin: corsOrigin }));
  app.use(express.json({ limit: '50kb' }));

  // Each call turn hits the LLM, so cap request volume per client to control cost and abuse.
  const chatLimiter = rateLimit({
    windowMs: 60_000,
    limit: 60,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'Too many requests. Please slow down.' },
  });

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', uptime: process.uptime() });
  });
  app.use('/api/seller', sellerRoutes(sellerData, diagnose(sellerData)));
  app.use('/api/chat', chatLimiter, chatRoutes(conversation));
  app.use('/api', notFoundHandler);

  // In production the built client is served by the same process.
  if (existsSync(CLIENT_DIST_PATH)) {
    app.use(express.static(CLIENT_DIST_PATH));
    app.get('/{*splat}', (_req, res) => {
      res.sendFile(path.join(CLIENT_DIST_PATH, 'index.html'));
    });
  }

  app.use(errorHandler);
  return app;
}
