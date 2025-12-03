/**
 * WhatsApp webhook handler
 * Processes incoming messages and webhook verification
 * Requirements: 1.1, 3.1, 4.1, 7.1, 8.1, 8.2
 */

import { Env } from '../config/env';
import { UserRepository } from '../repositories/user.repository';
import { SubscriptionHandler } from './subscription.handler';
import { UpdateHandler } from './update.handler';
import { UnsubscribeHandler } from './unsubscribe.handler';
import { PromptHandler } from './prompt.handler';
import { HelpHandler } from './help.handler';
import { PromptGenerator } from '../services/prompt-generator';
import { WhatsAppClient } from '../services/whatsapp.client';
import { PerplexityClient } from '../services/perplexity.client';
import { parseCommand } from '../utils/command-parser';
import { getMessage, DEFAULT_LANGUAGE } from '../i18n';
import { Logger } from '../utils/logger';
import type { WhatsAppWebhookPayload, Command } from '../types';

const logger = new Logger('WebhookHandler');

export class WebhookHandler {
  private userRepository: UserRepository;
  private subscriptionHandler: SubscriptionHandler;
  private updateHandler: UpdateHandler;
  private unsubscribeHandler: UnsubscribeHandler;
  private promptHandler: PromptHandler;
  private helpHandler: HelpHandler;
  private whatsappClient: WhatsAppClient;

  constructor(private env: Env) {
    // Initialize repositories and services
    this.userRepository = new UserRepository(env.DB);

    // Initialize WhatsApp client
    const whatsappApiUrl = env.WHATSAPP_API_URL || 'https://graph.facebook.com/v18.0';
    this.whatsappClient = new WhatsAppClient(
      whatsappApiUrl,
      env.WHATSAPP_API_TOKEN,
      env.WHATSAPP_PHONE_NUMBER_ID,
      env.DB
    );

    // Initialize Perplexity client and prompt generator
    const perplexityApiUrl = env.PERPLEXITY_API_URL || 'https://api.perplexity.ai';
    const perplexityTextModel = env.PERPLEXITY_TEXT_MODEL || 'llama-3.1-sonar-small-128k-online';
    const perplexityImageModel = env.PERPLEXITY_IMAGE_MODEL || 'playground-v2.5';
    const maxRetries = parseInt(env.MAX_RETRIES || '3', 10);
    const retryDelayMs = parseInt(env.RETRY_DELAY_MS || '1000', 10);
    const maxTokens = 500;

    const perplexityClient = new PerplexityClient(
      perplexityApiUrl,
      env.PERPLEXITY_API_KEY,
      perplexityTextModel,
      perplexityImageModel,
      maxTokens,
      maxRetries,
      retryDelayMs,
      env.DB
    );

    const promptGenerator = new PromptGenerator(perplexityClient);

    // Initialize command handlers
    this.subscriptionHandler = new SubscriptionHandler(this.userRepository);
    this.updateHandler = new UpdateHandler(this.userRepository);
    this.unsubscribeHandler = new UnsubscribeHandler(this.userRepository);
    this.promptHandler = new PromptHandler(
      this.userRepository,
      promptGenerator,
      this.whatsappClient
    );
    this.helpHandler = new HelpHandler(this.userRepository);
  }

  /**
   * Handle webhook verification (GET request from WhatsApp)
   * WhatsApp sends this to verify the webhook endpoint
   */
  async handleVerification(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');

    logger.info('Webhook verification request received', { mode });

    // Verify the token matches our configured token
    if (mode === 'subscribe' && token === this.env.WEBHOOK_VERIFY_TOKEN) {
      logger.info('Webhook verified successfully');
      return new Response(challenge, { status: 200 });
    }

    logger.warn('Webhook verification failed', { mode, tokenMatch: token === this.env.WEBHOOK_VERIFY_TOKEN });
    return new Response('Forbidden', { status: 403 });
  }

  /**
   * Handle incoming WhatsApp messages (POST request)
   * Requirements:
   * - Parse incoming message and extract phone number
   * - Route to appropriate command handler
   * - Handle unknown commands with helpful message in user's language
   * - Return appropriate HTTP response
   */
  async handleIncomingMessage(request: Request): Promise<Response> {
    try {
      // Verify WhatsApp webhook signature (if provided)
      const signature = request.headers.get('X-Hub-Signature-256');
      if (signature) {
        // Note: For production, implement signature verification using crypto
        // For now, we'll log it for debugging
        logger.debug('Webhook signature received', { signature: signature.substring(0, 20) + '...' });
      }

      // Parse the webhook payload
      const body = await request.json() as WhatsAppWebhookPayload;
      logger.debug('Received webhook payload', { object: body.object });

      // Validate webhook payload structure
      if (body.object !== 'whatsapp_business_account') {
        logger.warn('Invalid webhook object type', { object: body.object });
        return new Response(JSON.stringify({ success: false, error: 'Invalid object type' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Extract messages from the webhook payload
      for (const entry of body.entry) {
        for (const change of entry.changes) {
          if (change.field === 'messages' && change.value.messages) {
            for (const message of change.value.messages) {
              // Only process text messages
              if (message.type === 'text' && message.text?.body) {
                const phoneNumber = message.from;
                const messageText = message.text.body;

                logger.info('Processing incoming message', {
                  phoneNumber,
                  messageId: message.id,
                  messagePreview: messageText.substring(0, 50)
                });

                // Route the message to the appropriate handler
                await this.routeMessage(phoneNumber, messageText);
              }
            }
          }
        }
      }

      // Always return 200 OK to WhatsApp to acknowledge receipt
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      logger.error('Error handling incoming message', {
        error: error instanceof Error ? error.message : String(error)
      });

      // Still return 200 to WhatsApp to prevent retries
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  /**
   * Route a message to the appropriate command handler
   * @param phoneNumber - User's phone number
   * @param messageText - The message text from the user
   */
  private async routeMessage(phoneNumber: string, messageText: string): Promise<void> {
    try {
      // Parse the command from the message
      const command = parseCommand(messageText);

      logger.info('Command parsed', { phoneNumber, commandType: command.type });

      // Route to the appropriate handler
      let responseMessage: string;

      switch (command.type) {
        case 'subscribe':
          responseMessage = await this.subscriptionHandler.handleSubscribe(
            phoneNumber,
            command.skillLevel,
            command.language
          );
          break;

        case 'update_skill':
          responseMessage = await this.updateHandler.handleUpdateSkill(
            phoneNumber,
            command.skillLevel
          );
          break;

        case 'update_language':
          responseMessage = await this.updateHandler.handleUpdateLanguage(
            phoneNumber,
            command.language
          );
          break;

        case 'unsubscribe':
          responseMessage = await this.unsubscribeHandler.handleUnsubscribe(phoneNumber);
          break;

        case 'get_prompt':
          // PromptHandler sends the message directly, so we don't need to send it again
          responseMessage = await this.promptHandler.handleGetPrompt(phoneNumber);
          break;

        case 'help':
          responseMessage = await this.helpHandler.handleHelp(phoneNumber);
          break;

        case 'unknown':
          // Handle unknown commands with helpful message in user's language
          responseMessage = await this.handleUnknownCommand(phoneNumber);
          break;

        default:
          // This should never happen due to TypeScript exhaustiveness checking
          responseMessage = await this.handleUnknownCommand(phoneNumber);
          break;
      }

      // Send the response message if there is one
      // (PromptHandler returns empty string since it sends the message directly)
      if (responseMessage) {
        const sendResult = await this.whatsappClient.sendMessage(phoneNumber, responseMessage);

        if (!sendResult.success) {
          logger.error('Failed to send response message', {
            phoneNumber,
            error: sendResult.error
          });
        } else {
          logger.info('Response message sent successfully', {
            phoneNumber,
            messageId: sendResult.messageId
          });
        }
      }
    } catch (error) {
      logger.error('Error routing message', {
        phoneNumber,
        error: error instanceof Error ? error.message : String(error)
      });

      // Try to send a generic error message to the user
      try {
        const user = await this.userRepository.getUser(phoneNumber);
        const errorLanguage = user?.language || DEFAULT_LANGUAGE;
        const errorMessage = getMessage('error_general', errorLanguage);

        await this.whatsappClient.sendMessage(phoneNumber, errorMessage);
      } catch (sendError) {
        logger.error('Failed to send error message to user', {
          phoneNumber,
          error: sendError instanceof Error ? sendError.message : String(sendError)
        });
      }
    }
  }

  /**
   * Handle unknown commands by sending a helpful message in the user's language
   * Requirement 8.2: Unknown commands return helpful guidance in user's language
   * @param phoneNumber - User's phone number
   * @returns Error message with help suggestion
   */
  private async handleUnknownCommand(phoneNumber: string): Promise<string> {
    try {
      // Try to get the user's language preference
      const user = await this.userRepository.getUser(phoneNumber);
      const language = user?.language || DEFAULT_LANGUAGE;

      logger.info('Unknown command received', { phoneNumber, language });

      return getMessage('error_unknown_command', language);
    } catch (error) {
      logger.error('Error handling unknown command', {
        phoneNumber,
        error: error instanceof Error ? error.message : String(error)
      });

      // Fallback to default language
      return getMessage('error_unknown_command', DEFAULT_LANGUAGE);
    }
  }
}
