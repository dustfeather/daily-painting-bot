/**
 * Internationalization (i18n) module
 * Provides message retrieval in multiple languages with Romanian as default
 */

import { Language } from '../types';
import { messages, MessageKey, DEFAULT_LANGUAGE } from './messages';

/**
 * Retrieves a localized message for the given key and language
 *
 * @param key - The message key to retrieve
 * @param language - The language code (defaults to Romanian 'ro')
 * @param replacements - Optional object with placeholder replacements
 * @returns The localized message string
 *
 * @example
 * getMessage('welcome', 'en')
 * // Returns: "Welcome to Daily Painting Bot! 🎨..."
 *
 * @example
 * getMessage('error_already_subscribed', 'ro', { skillLevel: 'beginner', language: 'ro' })
 * // Returns: "ℹ️ Ești deja abonat! Nivelul tău actual: beginner, Limba: ro"
 */
export function getMessage(
  key: MessageKey,
  language: Language = DEFAULT_LANGUAGE,
  replacements?: Record<string, string>
): string {
  // Get the message template for the specified language
  const languageMessages = messages[language];

  if (!languageMessages) {
    // Fallback to default language if specified language not found
    const defaultMessage = messages[DEFAULT_LANGUAGE][key];
    return replacePlaceholders(defaultMessage, replacements);
  }

  const message = languageMessages[key];

  if (!message) {
    // Fallback to default language if message key not found
    const defaultMessage = messages[DEFAULT_LANGUAGE][key];
    return replacePlaceholders(defaultMessage || `[Missing message: ${key}]`, replacements);
  }

  return replacePlaceholders(message, replacements);
}

/**
 * Replaces placeholders in a message template with actual values
 * Placeholders are in the format {key}
 *
 * @param message - The message template with placeholders
 * @param replacements - Object with key-value pairs for replacement
 * @returns The message with placeholders replaced
 */
function replacePlaceholders(
  message: string,
  replacements?: Record<string, string>
): string {
  if (!replacements) {
    return message;
  }

  let result = message;

  for (const [key, value] of Object.entries(replacements)) {
    const placeholder = `{${key}}`;
    result = result.replace(new RegExp(placeholder, 'g'), value);
  }

  return result;
}

/**
 * Checks if a language is supported by the i18n system
 *
 * @param language - The language code to check
 * @returns True if the language is supported, false otherwise
 */
export function isSupportedLanguage(language: string): language is Language {
  return language in messages;
}

/**
 * Gets all supported languages
 *
 * @returns Array of supported language codes
 */
export function getSupportedLanguages(): Language[] {
  return Object.keys(messages) as Language[];
}

// Re-export types and constants for convenience
export type { MessageKey } from './messages';
export { DEFAULT_LANGUAGE } from './messages';
export type { Language } from '../types';
