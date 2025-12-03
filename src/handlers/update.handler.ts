/**
 * Update handlers for skill level and language preferences
 * Requirements: 3.1, 3.2, 3.3, 2.5
 */

import { UserRepository } from '../repositories/user.repository';
import { getMessage, DEFAULT_LANGUAGE } from '../i18n';
import { SkillLevel, Language, parseSkillLevel, isLanguage } from '../types';

export class UpdateHandler {
  constructor(private userRepository: UserRepository) {}

  /**
   * Handle skill level update flow
   *
   * Requirements:
   * - 3.1: Display current skill level and prompt for new value if not provided
   * - 3.2: Update the stored skill level for that user
   * - 3.3: Confirm the change with a success message
   *
   * @param phoneNumber - User's WhatsApp phone number
   * @param newSkillLevel - Optional new skill level (if not provided, will prompt)
   * @returns Response message in user's language
   */
  async handleUpdateSkill(
    phoneNumber: string,
    newSkillLevel?: SkillLevel
  ): Promise<string> {
    try {
      // Check if user is subscribed
      const user = await this.userRepository.getUser(phoneNumber);

      if (!user || !user.isActive) {
        // User is not subscribed
        return getMessage('error_not_subscribed', DEFAULT_LANGUAGE);
      }

      // If no new skill level provided, display current and prompt (Requirement 3.1)
      if (!newSkillLevel) {
        const currentMessage = getMessage('current_skill_level', user.language, {
          skillLevel: user.skillLevel,
        });
        const promptMessage = getMessage('prompt_skill_level', user.language);
        return `${currentMessage}\n\n${promptMessage}`;
      }

      // Update skill level in database (Requirement 3.2)
      await this.userRepository.updateSkillLevel(phoneNumber, newSkillLevel);

      // Return confirmation message (Requirement 3.3)
      return getMessage('skill_updated', user.language);
    } catch (error) {
      console.error('Error in handleUpdateSkill:', error);
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

  /**
   * Handle language preference update flow
   *
   * Requirements:
   * - 2.5: Display current language and prompt for new value if not provided
   * - 2.5: Update the stored language
   * - 2.5: Confirm the change with a success message
   *
   * @param phoneNumber - User's WhatsApp phone number
   * @param newLanguage - Optional new language (if not provided, will prompt)
   * @returns Response message in user's language
   */
  async handleUpdateLanguage(
    phoneNumber: string,
    newLanguage?: Language
  ): Promise<string> {
    try {
      // Check if user is subscribed
      const user = await this.userRepository.getUser(phoneNumber);

      if (!user || !user.isActive) {
        // User is not subscribed
        return getMessage('error_not_subscribed', DEFAULT_LANGUAGE);
      }

      // If no new language provided, display current and prompt (Requirement 2.5)
      if (!newLanguage) {
        const currentMessage = getMessage('current_language', user.language, {
          language: user.language,
        });
        const promptMessage = getMessage('prompt_language', user.language);
        return `${currentMessage}\n\n${promptMessage}`;
      }

      // Validate language
      if (!isLanguage(newLanguage)) {
        return getMessage('error_invalid_language', user.language);
      }

      // Update language in database (Requirement 2.5)
      await this.userRepository.updateLanguage(phoneNumber, newLanguage);

      // Return confirmation message in the NEW language (Requirement 2.5)
      return getMessage('language_updated', newLanguage);
    } catch (error) {
      console.error('Error in handleUpdateLanguage:', error);
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
