import { createApp } from './app.js';
import { env } from './config/env.js';
import { ConversationService } from './services/conversation.service.js';
import { loadSellerData } from './services/seller.service.js';
import { logger } from './utils/logger.js';

async function main(): Promise<void> {
  const sellerData = await loadSellerData();
  const conversation = ConversationService.create(env, sellerData);
  const app = createApp({ conversation, sellerData, corsOrigin: env.CORS_ORIGIN });

  const server = app.listen(env.PORT, () => {
    logger.info('SnapKAM server listening', { port: env.PORT, mode: env.NODE_ENV });
  });

  // Close the HTTP server cleanly on termination signals.
  const shutdown = (signal: string) => {
    logger.info('Shutting down', { signal });
    server.close(() => process.exit(0));
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main().catch((error) => {
  logger.error('Failed to start server', {
    error: error instanceof Error ? error.message : String(error),
  });
  process.exit(1);
});
