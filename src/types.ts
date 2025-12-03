/**
 * Shared type definitions for the Daily Painting Bot
 */

export type SkillLevel = 'beginner' | 'intermediate' | 'advanced';

export type Language = 'ro' | 'en';

export type Command =
  | { type: 'subscribe'; skillLevel?: SkillLevel; language?: Language }
  | { type: 'update_skill'; skillLevel?: SkillLevel }
  | { type: 'update_language'; language?: Language }
  | { type: 'unsubscribe' }
  | { type: 'get_prompt' }
  | { type: 'help' }
  | { type: 'unknown'; text: string };

export interface User {
  phoneNumber: string;
  skillLevel: SkillLevel;
  language: Language;
  subscribedAt: Date;
  lastPromptSent: Date | null;
  isActive: boolean;
}

export interface PaintingPrompt {
  text: string;
  imageUrl: string;
  skillLevel: SkillLevel;
  language: Language;
}

export interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface BulkSendResult {
  totalSent: number;
  totalFailed: number;
  failures: Array<{ phoneNumber: string; error: string }>;
}

export interface DeliveryReport {
  timestamp: Date;
  totalUsers: number;
  successCount: number;
  failureCount: number;
  promptsGenerated: number;
  imagesGenerated: number;
  apiUsage: {
    perplexityTokens: number;
    imageGenerations: number;
    whatsappMessages: number;
  };
}

export interface ImageResult {
  url: string;
}

// API Response Types

export interface PerplexityTextResponse {
  id: string;
  model: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface PerplexityImageResponse {
  data: Array<{
    url: string;
  }>;
}

export interface WhatsAppWebhookPayload {
  object: string;
  entry: Array<{
    id: string;
    changes: Array<{
      value: {
        messaging_product: string;
        metadata: {
          display_phone_number: string;
          phone_number_id: string;
        };
        contacts?: Array<{
          profile: {
            name: string;
          };
          wa_id: string;
        }>;
        messages?: Array<{
          from: string;
          id: string;
          timestamp: string;
          text: {
            body: string;
          };
          type: string;
        }>;
      };
      field: string;
    }>;
  }>;
}

export interface WhatsAppSendMessageResponse {
  messaging_product: string;
  contacts: Array<{
    input: string;
    wa_id: string;
  }>;
  messages: Array<{
    id: string;
  }>;
}

// Configuration Types

export interface BotConfig {
  whatsapp: {
    apiUrl: string;
    apiToken: string;
    phoneNumberId: string;
  };
  perplexity: {
    apiUrl: string;
    apiKey: string;
    textModel: string;
    imageModel: string;
    maxTokens: number;
  };
  scheduling: {
    cronExpression: string;
    timezone: string;
  };
  prompts: {
    maxRetries: number;
    retryDelayMs: number;
    fallbackPrompts: Record<string, Array<{ text: string; imageUrl: string }>>;
  };
  supportedLanguages: Language[];
}

export interface Env {
  DB: D1Database;
  WHATSAPP_API_TOKEN: string;
  WHATSAPP_PHONE_NUMBER_ID: string;
  PERPLEXITY_API_KEY: string;
  WEBHOOK_VERIFY_TOKEN: string;
  PERPLEXITY_API_URL?: string;
  PERPLEXITY_TEXT_MODEL?: string;
  PERPLEXITY_IMAGE_MODEL?: string;
  WHATSAPP_API_URL?: string;
  MAX_RETRIES?: string;
  RETRY_DELAY_MS?: string;
}

// Skill Level Utilities

/**
 * Convert a number (1, 2, 3) to a skill level
 * @param value - Number representing skill level (1 = beginner, 2 = intermediate, 3 = advanced)
 * @returns SkillLevel or null if invalid
 */
export function numberToSkillLevel(value: number | string): SkillLevel | null {
  const num = typeof value === 'string' ? parseInt(value, 10) : value;

  switch (num) {
    case 1:
      return 'beginner';
    case 2:
      return 'intermediate';
    case 3:
      return 'advanced';
    default:
      return null;
  }
}

/**
 * Convert a skill level to a number
 * @param skillLevel - Skill level string
 * @returns Number (1, 2, or 3)
 */
export function skillLevelToNumber(skillLevel: SkillLevel): number {
  switch (skillLevel) {
    case 'beginner':
      return 1;
    case 'intermediate':
      return 2;
    case 'advanced':
      return 3;
  }
}

/**
 * Parse skill level from user input (accepts both numbers and words)
 * @param value - User input (can be '1', 'beginner', etc.)
 * @returns SkillLevel or null if invalid
 */
export function parseSkillLevel(value: unknown): SkillLevel | null {
  if (typeof value === 'number') {
    return numberToSkillLevel(value);
  }

  if (typeof value === 'string') {
    const trimmed = value.trim().toLowerCase();

    // Try as number first
    if (/^[1-3]$/.test(trimmed)) {
      return numberToSkillLevel(parseInt(trimmed, 10));
    }

    // Try as skill level word
    if (trimmed === 'beginner' || trimmed === 'intermediate' || trimmed === 'advanced') {
      return trimmed as SkillLevel;
    }
  }

  return null;
}

// Type Guards for Runtime Validation

export function isSkillLevel(value: unknown): value is SkillLevel {
  return (
    typeof value === 'string' &&
    (value === 'beginner' || value === 'intermediate' || value === 'advanced')
  );
}

export function isLanguage(value: unknown): value is Language {
  return typeof value === 'string' && ['ro', 'en'].includes(value);
}

export function isUser(value: unknown): value is User {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const obj = value as Record<string, unknown>;

  return (
    typeof obj.phoneNumber === 'string' &&
    isSkillLevel(obj.skillLevel) &&
    isLanguage(obj.language) &&
    (obj.subscribedAt instanceof Date || typeof obj.subscribedAt === 'string') &&
    (obj.lastPromptSent === null || obj.lastPromptSent instanceof Date || typeof obj.lastPromptSent === 'string') &&
    typeof obj.isActive === 'boolean'
  );
}

export function isPaintingPrompt(value: unknown): value is PaintingPrompt {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const obj = value as Record<string, unknown>;

  return (
    typeof obj.text === 'string' &&
    typeof obj.imageUrl === 'string' &&
    isSkillLevel(obj.skillLevel) &&
    isLanguage(obj.language)
  );
}

export function isCommand(value: unknown): value is Command {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const obj = value as Record<string, unknown>;

  if (typeof obj.type !== 'string') {
    return false;
  }

  switch (obj.type) {
    case 'subscribe':
      return (
        (obj.skillLevel === undefined || isSkillLevel(obj.skillLevel)) &&
        (obj.language === undefined || isLanguage(obj.language))
      );
    case 'update_skill':
      return obj.skillLevel === undefined || isSkillLevel(obj.skillLevel);
    case 'update_language':
      return obj.language === undefined || isLanguage(obj.language);
    case 'unsubscribe':
    case 'get_prompt':
    case 'help':
      return true;
    case 'unknown':
      return typeof obj.text === 'string';
    default:
      return false;
  }
}

export function isWhatsAppWebhookPayload(value: unknown): value is WhatsAppWebhookPayload {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const obj = value as Record<string, unknown>;

  return (
    typeof obj.object === 'string' &&
    Array.isArray(obj.entry)
  );
}
