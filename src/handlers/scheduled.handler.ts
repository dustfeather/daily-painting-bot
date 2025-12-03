/**
 * Scheduled delivery handler
 * Executes daily prompt delivery via cron trigger
 */

import { Env } from '../config/env';
import { UserRepository } from '../repositories/user.repository';
import { PerplexityClient, PromptGenerator, WhatsAppClient, Scheduler } from '../services';
import { Logger } from '../utils/logger';

const logger = new Logger('ScheduledHandler');

export class ScheduledHandler {
  private scheduler: Scheduler;

  constructor(env: Env) {
    // Initialize dependencies
    const userRepository = new UserRepository(env.DB);

    const perplexityApiUrl = env.PERPLEXITY_API_URL || 'https://api.perplexity.ai';
    const perplexityClient = new PerplexityClient(
      perplexityApiUrl,
      env.PERPLEXITY_API_KEY,
      env.PERPLEXITY_TEXT_MODEL || 'llama-3.1-sonar-small-128k-online',
      env.PERPLEXITY_IMAGE_MODEL || 'playground-v2.5',
      500,
      parseInt(env.MAX_RETRIES || '3', 10),
      parseInt(env.RETRY_DELAY_MS || '1000', 10),
      env.DB
    );

    const promptGenerator = new PromptGenerator(perplexityClient);

    const whatsappApiUrl = env.WHATSAPP_API_URL || 'https://graph.facebook.com/v18.0';
    const whatsappClient = new WhatsAppClient(
      whatsappApiUrl,
      env.WHATSAPP_API_TOKEN,
      env.WHATSAPP_PHONE_NUMBER_ID,
      env.DB
    );

    // Initialize scheduler with all dependencies
    this.scheduler = new Scheduler(userRepository, promptGenerator, whatsappClient, env.DB);
  }

  /**
   * Execute daily prompt delivery to all active users
   * This method is called by the cron trigger
   */
  async executeDailyDelivery(): Promise<void> {
    logger.info('Starting daily delivery...');

    try {
      const report = await this.scheduler.executeDailyDelivery();

      logger.info('Daily delivery completed successfully', {
        totalUsers: report.totalUsers,
        successCount: report.successCount,
        failureCount: report.failureCount,
        promptsGenerated: report.promptsGenerated,
        imagesGenerated: report.imagesGenerated,
      });
    } catch (error) {
      logger.error('Error in daily delivery:', error);
      throw error;
    }
  }
}
