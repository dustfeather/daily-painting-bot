/**
 * API Usage Logger
 * Logs all external API calls to the api_usage_logs table
 * Tracks Perplexity AI (text and image generation) and WhatsApp API usage
 */

import { Logger } from '../utils/logger';

const logger = new Logger('ApiLogger');

export type ApiService = 'perplexity' | 'whatsapp' | 'image_generation';

export interface ApiUsageLogParams {
  service: ApiService;
  operation: string;
  tokensUsed?: number;
  messagesSent?: number;
  imagesGenerated?: number;
  success: boolean;
  error?: string;
}

/**
 * Log API usage to the database
 * @param db - D1 Database instance
 * @param params - API usage parameters
 */
export async function logApiUsage(
  db: D1Database,
  params: ApiUsageLogParams
): Promise<void> {
  try {
    const {
      service,
      operation,
      tokensUsed = null,
      messagesSent = null,
      imagesGenerated = null,
      success,
      error = null,
    } = params;

    await db
      .prepare(
        `INSERT INTO api_usage_logs
        (service, operation, tokens_used, messages_sent, images_generated, success, error_message)
        VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        service,
        operation,
        tokensUsed,
        messagesSent,
        imagesGenerated,
        success ? 1 : 0,
        error
      )
      .run();

    logger.debug('API usage logged', {
      service,
      operation,
      success,
    });
  } catch (err) {
    // Log the error but don't throw - we don't want logging failures to break the application
    logger.error('Failed to log API usage', {
      error: err instanceof Error ? err.message : String(err),
      service: params.service,
      operation: params.operation,
    });
  }
}
