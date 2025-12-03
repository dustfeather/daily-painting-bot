/**
 * On-demand prompt handler
 * Handles user requests for immediate painting prompts
 * Requirements: 7.1, 7.2, 7.3
 */

import { UserRepository } from '../repositories/user.repository';
import { PromptGenerator } from '../services/prompt-generator';
import { WhatsAppClient } from '../services/whatsapp.client';
import { getMessage, DEFAULT_LANGUAGE } from '../i18n';
import { Logger } from '../utils/logger';

const logger = new Logger('PromptHandler');

export class PromptHandler {
  constructor(
    private userRepository: UserRepository,
    private promptGenerator: PromptGenerator,
    private whatsappClient: WhatsAppClient
  ) {}

  /**
   * Handle on-demand prompt request flow
   *
   * Requirements:
   * - 7.1: Generate a new painting idea based on user's skill level
   * - 7.2: Send the prompt immediately to the requesting user
   * - 7.3: Inform unsubscribed users they need to subscribe first
   *
   * @param phoneNumber - User's WhatsApp phone number
   * @returns Response message in user's language
   */
  async handleGetPrompt(phoneNumber: string): Promise<string> {
    try {
      // Check if user is subscribed (Requirement 7.3)
      const user = await this.userRepository.getUser(phoneNumber);

      if (!user || !user.isActive) {
        // User is not subscribed - inform them to subscribe first
        logger.info('Unsubscribed user requested prompt', { phoneNumber });
        return getMessage('error_not_subscribed', DEFAULT_LANGUAGE);
      }

      logger.info('Generating on-demand prompt', {
        phoneNumber,
        skillLevel: user.skillLevel,
        language: user.language,
      });

      // Retrieve user's skill level and language from database
      const { skillLevel, language } = user;

      // Generate prompt using PromptGenerator (Requirement 7.1)
      const prompt = await this.promptGenerator.generatePromptWithRetry(
        skillLevel,
        language,
        3
      );

      logger.info('Prompt generated successfully', {
        phoneNumber,
        skillLevel,
        language,
        hasImage: !!prompt.imageUrl,
      });

      // Send prompt with image immediately via WhatsApp (Requirement 7.2)
      const sendResult = await this.whatsappClient.sendMessageWithImage(
        phoneNumber,
        prompt.text,
        prompt.imageUrl
      );

      if (!sendResult.success) {
        logger.error('Failed to send prompt via WhatsApp', {
          phoneNumber,
          error: sendResult.error,
        });
        return getMessage('error_general', language);
      }

      // Update last prompt sent timestamp
      await this.userRepository.updateLastPromptSent(phoneNumber);

      logger.info('On-demand prompt sent successfully', {
        phoneNumber,
        messageId: sendResult.messageId,
      });

      // Return success - the prompt was sent as a separate message
      // This return value is for the webhook response
      return '';
    } catch (error) {
      logger.error('Error in handleGetPrompt', {
        phoneNumber,
        error: error instanceof Error ? error.message : String(error),
      });

      // Try to get user's language for error message, fallback to default
      try {
        const user = await this.userRepository.getUser(phoneNumber);
        const errorLanguage = user?.language || DEFAULT_LANGUAGE;
        return getMessage('error_general', errorLanguage);
      } catch {
        return getMessage('error_general', DEFAULT_LANGUAGE);
      }
    }
  }
}
