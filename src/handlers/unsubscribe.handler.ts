/**
 * Unsubscribe handler
 * Handles user unsubscription flow
 * Requirements: 4.1, 4.2
 */

import { UserRepository } from '../repositories/user.repository';
import { getMessage, DEFAULT_LANGUAGE } from '../i18n';

export class UnsubscribeHandler {
  constructor(private userRepository: UserRepository) {}

  /**
   * Handle user unsubscribe flow
   *
   * Requirements:
   * - 4.1: Remove the user from the active subscription list
   * - 4.2: Send a confirmation message
   *
   * @param phoneNumber - User's WhatsApp phone number
   * @returns Response message in user's language
   */
  async handleUnsubscribe(phoneNumber: string): Promise<string> {
    try {
      // Check if user is subscribed
      const user = await this.userRepository.getUser(phoneNumber);

      if (!user || !user.isActive) {
        // User is not subscribed or already inactive
        return getMessage('error_not_subscribed', DEFAULT_LANGUAGE);
      }

      // Mark user as inactive in database (Requirement 4.1)
      await this.userRepository.deactivateUser(phoneNumber);

      // Return confirmation message in user's language (Requirement 4.2)
      return getMessage('unsubscribe_confirmed', user.language);
    } catch (error) {
      console.error('Error in handleUnsubscribe:', error);
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
