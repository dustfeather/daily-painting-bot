/**
 * Delivery Logger
 * Logs delivery reports after each scheduled delivery
 * Tracks total users, success/failure counts, prompts generated, and execution time
 * Requirement 11.3: Generate summary report after daily processing
 */

import { Logger } from '../utils/logger';
import { DeliveryReport } from '../types';

const logger = new Logger('DeliveryLogger');

export interface DeliveryLogParams {
  totalUsers: number;
  successCount: number;
  failureCount: number;
  promptsGenerated: number;
  imagesGenerated: number;
  executionTime: number;
}

/**
 * Log delivery report to the database
 * Requirement 11.3: Generate a summary report of API usage after daily processing
 *
 * @param db - D1 Database instance
 * @param params - Delivery report parameters
 */
export async function logDeliveryReport(
  db: D1Database,
  params: DeliveryLogParams
): Promise<void> {
  try {
    const {
      totalUsers,
      successCount,
      failureCount,
      promptsGenerated,
      imagesGenerated,
      executionTime,
    } = params;

    await db
      .prepare(
        `INSERT INTO delivery_logs
        (total_users, success_count, failure_count, prompts_generated, images_generated, execution_time_ms)
        VALUES (?, ?, ?, ?, ?, ?)`
      )
      .bind(
        totalUsers,
        successCount,
        failureCount,
        promptsGenerated,
        imagesGenerated,
        executionTime
      )
      .run();

    logger.info('Delivery report logged', {
      totalUsers,
      successCount,
      failureCount,
      promptsGenerated,
      imagesGenerated,
      executionTimeMs: executionTime,
    });
  } catch (err) {
    // Log the error but don't throw - we don't want logging failures to break the application
    logger.error('Failed to log delivery report', {
      error: err instanceof Error ? err.message : String(err),
      totalUsers: params.totalUsers,
      successCount: params.successCount,
    });
  }
}
