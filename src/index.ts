/**
 * Daily Painting Bot - Cloudflare Worker Entry Point
 *
 * This worker handles:
 * 1. Incoming WhatsApp webhook messages (HTTP requests)
 * 2. Scheduled daily prompt delivery (Cron trigger)
 */

import { Env, validateEnv } from './config/env';
import { WebhookHandler } from './handlers/webhook.handler';
import { ScheduledHandler } from './handlers/scheduled.handler';
import { Logger } from './utils/logger';

const logger = new Logger('Worker');

/**
 * HTTP request handler for WhatsApp webhook
 */
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    try {
      validateEnv(env);

      const url = new URL(request.url);
      const webhookHandler = new WebhookHandler(env);

      // Handle webhook verification (GET request from WhatsApp)
      if (request.method === 'GET' && url.pathname === '/webhook') {
        return await webhookHandler.handleVerification(request);
      }

      // Handle incoming messages (POST request from WhatsApp)
      if (request.method === 'POST' && url.pathname === '/webhook') {
        return await webhookHandler.handleIncomingMessage(request);
      }

      // Health check endpoint
      if (url.pathname === '/health') {
        return new Response(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }

      return new Response('Not Found', { status: 404 });
    } catch (error) {
      logger.error('Error in fetch handler:', error);
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  },

  /**
   * Scheduled handler for daily prompt delivery (Cron trigger)
   */
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    logger.info('Cron trigger fired at:', new Date(event.scheduledTime).toISOString());

    try {
      validateEnv(env);
      const scheduledHandler = new ScheduledHandler(env);
      await scheduledHandler.executeDailyDelivery();
    } catch (error) {
      logger.error('Error in scheduled handler:', error);
    }
  },
};

export type { Env };
