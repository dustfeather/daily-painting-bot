/**
 * Environment configuration and validation
 */

export interface Env {
  // D1 Database binding
  DB: D1Database;

  // API credentials (secrets)
  WHATSAPP_API_TOKEN: string;
  WHATSAPP_PHONE_NUMBER_ID: string;
  PERPLEXITY_API_KEY: string;
  WEBHOOK_VERIFY_TOKEN: string;

  // Configuration variables
  PERPLEXITY_API_URL: string;
  PERPLEXITY_TEXT_MODEL: string;
  PERPLEXITY_IMAGE_MODEL: string;
  WHATSAPP_API_URL: string;
  MAX_RETRIES: string;
  RETRY_DELAY_MS: string;
}

export function validateEnv(env: Env): void {
  const required = [
    'DB',
    'WHATSAPP_API_TOKEN',
    'WHATSAPP_PHONE_NUMBER_ID',
    'PERPLEXITY_API_KEY',
    'WEBHOOK_VERIFY_TOKEN',
  ];

  for (const key of required) {
    if (!env[key as keyof Env]) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  }
}
