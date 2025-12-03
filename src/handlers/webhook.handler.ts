/**
 * WhatsApp webhook handler
 * Processes incoming messages and webhook verification
 */

import { Env } from '../config/env';

export class WebhookHandler {
  constructor(private env: Env) {}

  /**
   * Handle webhook verification (GET request from WhatsApp)
   */
  async handleVerification(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');

    if (mode === 'subscribe' && token === this.env.WEBHOOK_VERIFY_TOKEN) {
      console.log('Webhook verified successfully');
      return new Response(challenge, { status: 200 });
    }

    return new Response('Forbidden', { status: 403 });
  }

  /**
   * Handle incoming WhatsApp messages (POST request)
   */
  async handleIncomingMessage(request: Request): Promise<Response> {
    try {
      const body = await request.json();
      console.log('Received webhook:', JSON.stringify(body));

      // TODO: Parse message and route to appropriate command handler

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('Error handling incoming message:', error);
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }
}
