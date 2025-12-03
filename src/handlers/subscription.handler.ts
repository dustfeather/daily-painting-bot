/**
 * Subscription flow handler
 * Handles user subscription with skill level and language preferences
 * Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2
 */

import { UserRepository } from '../repositories/user.repository';
import { getMessage, DEFAULT_LANGUAGE } from '../i18n';
import { SkillLevel, Language, parseSkillLevel, isLanguage } from '../types';

export class SubscriptionHandler {
  constructor(private userRepository: UserRepository) {}

  /**
   * Handle user subscription flow
   *
   * Requirements:
   * - 1.1: Prompt user to select skill level
   * - 1.2: Store user's phone number and skill level
   * - 1.3: Check if user already subscribed (idempotency)
   * - 1.4: Confirm successful subscription with welcome message
   * - 2.1: Prompt user to select preferred language
   * - 2.2: Store language preference with subscription
   *
   * @param phoneNumber - User's WhatsApp phone number
   * @param skillLevel - Optional skill level (if not provided, will prompt)
   * @param language - Optional language preference (defaults to Romanian)
   * @returns Response message in user's language
   */
  async handleSubscribe(
    phoneNumber: string,
    skillLevel?: SkillLevel,
    language?: Language
  ): Promise<string> {
    try {
      // Check if user already subscribed (Requirement 1.3)
      const existingUser = await this.userRepository.getUser(phoneNumber);

      if (existingUser && existingUser.isActive) {
        // User is already subscribed - return current status
        return getMessage(
          'error_already_subscribed',
          existingUser.language,
          {
            skillLevel: existingUser.skillLevel,
            language: existingUser.language,
          }
        );
      }

      // Validate or prompt for skill level (Requirement 1.1)
      if (!skillLevel) {
        // No skill level provided - prompt user to provide it
        const promptLanguage = language || DEFAULT_LANGUAGE;
        return getMessage('prompt_skill_level', promptLanguage);
      }

      // Validate or prompt for language (Requirement 2.1)
      if (!language) {
        // No language provided - prompt user to provide it
        return getMessage('prompt_language', DEFAULT_LANGUAGE);
      }

      // Validate language
      if (!isLanguage(language)) {
        return getMessage('error_invalid_language', DEFAULT_LANGUAGE);
      }

      // Store user in database (Requirements 1.2, 2.2)
      await this.userRepository.createUser(phoneNumber, skillLevel, language);

      // Return welcome message and subscription confirmation (Requirement 1.4)
      const welcomeMessage = getMessage('welcome', language);
      const confirmationMessage = getMessage('subscription_confirmed', language);

      return `${welcomeMessage}\n\n${confirmationMessage}`;
    } catch (error) {
      console.error('Error in handleSubscribe:', error);
      // Return error message in the provided language or default
      const errorLanguage = language || DEFAULT_LANGUAGE;
      return getMessage('error_general', errorLanguage);
    }
  }

  /**
   * Validate skill level input from user
   * Accepts both numeric (1, 2, 3) and text (beginner, intermediate, advanced) formats
   *
   * @param input - User input for skill level
   * @returns SkillLevel if valid, null otherwise
   */
  validateSkillLevel(input: string): SkillLevel | null {
    return parseSkillLevel(input);
  }

  /**
   * Validate language input from user
   *
   * @param input - User input for language
   * @returns Language if valid, null otherwise
   */
  validateLanguage(input: string): Language | null {
    const normalized = input.trim().toLowerCase();
    return isLanguage(normalized) ? (normalized as Language) : null;
  }
}
