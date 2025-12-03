/**
 * Help command handler
 * Provides users with information about available commands
 * Requirements: 8.1
 */

import { UserRepository } from '../repositories/user.repository';
import { getMessage, DEFAULT_LANGUAGE } from '../i18n';
import { Language } from '../types';

export class HelpHandler {
  constructor(private userRepository: UserRepository) {}

  /**
   * Handle help command request
   *
   * Requirements:
   * - 8.1: Respond with a list of available commands and their descriptions
   *
   * @param phoneNumber - User's WhatsApp phone number
   * @returns Localized help text with available commands
   */
  async handleHelp(phoneNumber: string): Promise<string> {
    try {
      // Retrieve user's language preference (or default to Romanian)
      const user = await this.userRepository.getUser(phoneNumber);
      const language: Language = user?.language || DEFAULT_LANGUAGE;

      // Return localized help text with available commands
      return getMessage('help_text', language);
    } catch (error) {
      console.error('Error in handleHelp:', error);
      // On error, return help text in default language
      return getMessage('help_text', DEFAULT_LANGUAGE);
    }
  }
}
