import { Router } from 'express';
import { z } from 'zod';
import type { ConversationService } from '../services/conversation.service.js';

const MAX_MESSAGES = 40;
const MAX_MESSAGE_LENGTH = 1000;

const chatRequestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().trim().min(1).max(MAX_MESSAGE_LENGTH),
      }),
    )
    .max(MAX_MESSAGES),
  language: z.enum(['en-IN', 'hi-IN']).default('en-IN'),
  endCall: z.boolean().default(false),
});

/**
 * POST /api/chat
 * Stateless: the client sends the full transcript so far (empty to start the call) and
 * receives the bot's next turn.
 */
export function chatRoutes(conversation: ConversationService): Router {
  const router = Router();

  router.post('/', async (req, res) => {
    const request = chatRequestSchema.parse(req.body);
    const response = await conversation.reply(request);
    res.json(response);
  });

  return router;
}
