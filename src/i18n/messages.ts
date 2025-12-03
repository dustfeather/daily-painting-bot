/**
 * Message templates for internationalization
 * Supports multiple languages with Romanian (ro) as default
 */

import { Language } from '../types';

export type MessageKey =
  | 'welcome'
  | 'subscription_confirmed'
  | 'skill_updated'
  | 'language_updated'
  | 'unsubscribe_confirmed'
  | 'help_text'
  | 'error_invalid_skill'
  | 'error_invalid_language'
  | 'error_not_subscribed'
  | 'error_already_subscribed'
  | 'error_unknown_command'
  | 'error_general'
  | 'prompt_skill_level'
  | 'prompt_language'
  | 'current_skill_level'
  | 'current_language';

/**
 * Message templates organized by language
 */
export const messages: Record<Language, Record<MessageKey, string>> = {
  ro: {
    welcome: 'Bine ai venit la Bot-ul de Pictură Zilnică! 🎨\n\nVei primi în fiecare zi o idee nouă de pictură adaptată nivelului tău de experiență.',
    subscription_confirmed: 'Abonarea ta a fost confirmată! ✅\n\nVei primi prima ta idee de pictură mâine dimineață la ora 8:00 UTC.',
    skill_updated: 'Nivelul tău de experiență a fost actualizat cu succes! ✅\n\nDe acum înainte vei primi idei de pictură adaptate noului tău nivel.',
    language_updated: 'Limba ta preferată a fost actualizată cu succes! ✅\n\nDe acum înainte vei primi toate mesajele în limba selectată.',
    unsubscribe_confirmed: 'Dezabonarea ta a fost confirmată. 👋\n\nNu vei mai primi idei de pictură zilnice. Dacă vrei să te reabonezi, trimite "subscribe".',
    help_text: '📋 Comenzi disponibile:\n\n• subscribe / abonare - Abonează-te pentru a primi idei zilnice\n• update_skill / nivel - Actualizează nivelul tău de experiență\n• update_language / limba - Schimbă limba preferată\n• get_prompt / idee - Primește o idee de pictură acum\n• unsubscribe / dezabonare - Dezabonează-te\n• help / ajutor - Afișează acest mesaj',
    error_invalid_skill: '❌ Nivel de experiență invalid. Te rog alege unul dintre:\n• 1 sau beginner (începător)\n• 2 sau intermediate (intermediar)\n• 3 sau advanced (avansat)',
    error_invalid_language: '❌ Limbă invalidă. Te rog alege una dintre limbile suportate.',
    error_not_subscribed: '❌ Nu ești abonat. Trimite "subscribe" pentru a te abona.',
    error_already_subscribed: 'ℹ️ Ești deja abonat! Nivelul tău actual: {skillLevel}, Limba: {language}',
    error_unknown_command: '❌ Comandă necunoscută. Trimite "help" pentru a vedea comenzile disponibile.',
    error_general: '❌ A apărut o eroare. Te rog încearcă din nou mai târziu.',
    prompt_skill_level: 'Te rog alege nivelul tău de experiență:\n• 1 sau beginner (începător)\n• 2 sau intermediate (intermediar)\n• 3 sau advanced (avansat)',
    prompt_language: 'Te rog alege limba preferată:\n• ro (Română)\n• en (English)',
    current_skill_level: 'Nivelul tău actual de experiență: {skillLevel}',
    current_language: 'Limba ta actuală: {language}',
  },
  en: {
    welcome: 'Welcome to Daily Painting Bot! 🎨\n\nYou will receive a new painting idea every day adapted to your skill level.',
    subscription_confirmed: 'Your subscription has been confirmed! ✅\n\nYou will receive your first painting idea tomorrow morning at 8:00 AM UTC.',
    skill_updated: 'Your skill level has been updated successfully! ✅\n\nFrom now on you will receive painting ideas adapted to your new level.',
    language_updated: 'Your preferred language has been updated successfully! ✅\n\nFrom now on you will receive all messages in the selected language.',
    unsubscribe_confirmed: 'Your unsubscription has been confirmed. 👋\n\nYou will no longer receive daily painting ideas. If you want to resubscribe, send "subscribe".',
    help_text: '📋 Available commands:\n\n• subscribe - Subscribe to receive daily ideas\n• update_skill - Update your skill level\n• update_language - Change preferred language\n• get_prompt - Get a painting idea now\n• unsubscribe - Unsubscribe\n• help - Show this message',
    error_invalid_skill: '❌ Invalid skill level. Please choose one of:\n• 1 or beginner\n• 2 or intermediate\n• 3 or advanced',
    error_invalid_language: '❌ Invalid language. Please choose one of the supported languages.',
    error_not_subscribed: '❌ You are not subscribed. Send "subscribe" to subscribe.',
    error_already_subscribed: 'ℹ️ You are already subscribed! Your current level: {skillLevel}, Language: {language}',
    error_unknown_command: '❌ Unknown command. Send "help" to see available commands.',
    error_general: '❌ An error occurred. Please try again later.',
    prompt_skill_level: 'Please choose your skill level:\n• 1 or beginner\n• 2 or intermediate\n• 3 or advanced',
    prompt_language: 'Please choose your preferred language:\n• ro (Romanian)\n• en (English)',
    current_skill_level: 'Your current skill level: {skillLevel}',
    current_language: 'Your current language: {language}',
  },
};

/**
 * Default language for the bot
 */
export const DEFAULT_LANGUAGE: Language = 'ro';
