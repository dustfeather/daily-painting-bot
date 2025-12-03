/**
 * Command parser for WhatsApp messages
 * Extracts command type and parameters from user messages
 */

import { Command, SkillLevel, Language, parseSkillLevel, isLanguage } from '../types';

/**
 * Parse a WhatsApp message and extract the command type and parameters
 * @param message - The raw message text from the user
 * @returns Command object with type and optional parameters
 */
export function parseCommand(message: string): Command {
  // Normalize the message: trim whitespace and convert to lowercase
  const normalized = message.trim().toLowerCase();

  // Handle empty messages
  if (!normalized) {
    return { type: 'unknown', text: message };
  }

  // Split message into words for parameter extraction
  const words = normalized.split(/\s+/);
  const firstWord = words[0];

  // Parse subscribe command
  // Formats: "subscribe", "subscribe beginner", "subscribe 1", "subscribe beginner en"
  // Romanian: "abonare", "aboneaza", "abonează"
  if (
    firstWord === 'subscribe' ||
    firstWord === 'sub' ||
    firstWord === 'abonare' ||
    firstWord === 'aboneaza' ||
    firstWord === 'abonează'
  ) {
    const skillLevel = words.length > 1 ? parseSkillLevel(words[1]) : undefined;
    const language = words.length > 2 && isLanguage(words[2]) ? (words[2] as Language) : undefined;

    return {
      type: 'subscribe',
      skillLevel: skillLevel || undefined,
      language: language || undefined,
    };
  }

  // Parse update_skill command
  // Formats: "update_skill", "update skill", "skill intermediate", "skill 2"
  // Romanian: "actualizeaza nivel", "actualizează nivel", "nivel", "experienta", "experiență"
  if (
    firstWord === 'update_skill' ||
    firstWord === 'update-skill' ||
    firstWord === 'skill' ||
    firstWord === 'nivel' ||
    firstWord === 'experienta' ||
    firstWord === 'experiență' ||
    (firstWord === 'update' && words[1] === 'skill') ||
    (firstWord === 'actualizeaza' && words[1] === 'nivel') ||
    (firstWord === 'actualizează' && words[1] === 'nivel')
  ) {
    const skillIndex = firstWord === 'update' || firstWord === 'actualizeaza' || firstWord === 'actualizează' ? 2 : 1;
    const skillLevel = words.length > skillIndex ? parseSkillLevel(words[skillIndex]) : undefined;

    return {
      type: 'update_skill',
      skillLevel: skillLevel || undefined,
    };
  }

  // Parse update_language command
  // Formats: "update_language", "update language", "language en", "lang ro"
  // Romanian: "actualizeaza limba", "actualizează limba", "limba", "schimba limba", "schimbă limba"
  if (
    firstWord === 'update_language' ||
    firstWord === 'update-language' ||
    firstWord === 'language' ||
    firstWord === 'lang' ||
    firstWord === 'limba' ||
    (firstWord === 'update' && words[1] === 'language') ||
    (firstWord === 'update' && words[1] === 'lang') ||
    (firstWord === 'actualizeaza' && words[1] === 'limba') ||
    (firstWord === 'actualizează' && words[1] === 'limba') ||
    (firstWord === 'schimba' && words[1] === 'limba') ||
    (firstWord === 'schimbă' && words[1] === 'limba')
  ) {
    const langIndex = firstWord === 'update' || firstWord === 'actualizeaza' || firstWord === 'actualizează' || firstWord === 'schimba' || firstWord === 'schimbă' ? 2 : 1;
    const language = words.length > langIndex && isLanguage(words[langIndex]) ? (words[langIndex] as Language) : undefined;

    return {
      type: 'update_language',
      language: language || undefined,
    };
  }

  // Parse unsubscribe command
  // Formats: "unsubscribe", "unsub", "stop"
  // Romanian: "dezabonare", "dezaboneaza", "dezabonează", "opreste", "oprește"
  if (
    firstWord === 'unsubscribe' ||
    firstWord === 'unsub' ||
    firstWord === 'stop' ||
    firstWord === 'dezabonare' ||
    firstWord === 'dezaboneaza' ||
    firstWord === 'dezabonează' ||
    firstWord === 'opreste' ||
    firstWord === 'oprește'
  ) {
    return { type: 'unsubscribe' };
  }

  // Parse get_prompt command
  // Formats: "get_prompt", "get prompt", "prompt", "paint", "idea"
  // Romanian: "idee", "picteaza", "pictează", "sugestie"
  if (
    firstWord === 'get_prompt' ||
    firstWord === 'get-prompt' ||
    firstWord === 'prompt' ||
    firstWord === 'paint' ||
    firstWord === 'idea' ||
    firstWord === 'idee' ||
    firstWord === 'picteaza' ||
    firstWord === 'pictează' ||
    firstWord === 'sugestie' ||
    (firstWord === 'get' && words[1] === 'prompt')
  ) {
    return { type: 'get_prompt' };
  }

  // Parse help command
  // Formats: "help", "?", "commands"
  // Romanian: "ajutor", "comenzi"
  if (
    firstWord === 'help' ||
    firstWord === '?' ||
    firstWord === 'commands' ||
    firstWord === 'ajutor' ||
    firstWord === 'comenzi'
  ) {
    return { type: 'help' };
  }

  // Unknown command
  return { type: 'unknown', text: message };
}
