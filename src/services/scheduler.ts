/**
 * Scheduler Component
 * Orchestrates daily prompt delivery to all active users
 * Handles grouping, prompt generation, and bulk messaging
 */

import { SkillLevel, Language, PaintingPrompt, DeliveryReport } from '../types';
import { UserRepository } from '../repositories/user.repository';
import { PromptGenerator } from './prompt-generator';
import { WhatsAppClient } from './whatsapp.client';
import { Logger } from '../utils/logger';
import { logDeliveryReport } from './delivery-logger';

export class Scheduler {
  private userRepository: UserRepository;
  private promptGenerator: PromptGenerator;
  private whatsappClient: WhatsAppClient;
  private db: D1Database;
  private logger: Logger;

  constructor(
    userRepository: UserRepository,
    promptGenerator: PromptGenerator,
    whatsappClient: WhatsAppClient,
    db: D1Database
  ) {
    this.userRepository = userRepository;
    this.promptGenerator = promptGenerator;
    this.whatsappClient = whatsappClient;
    this.db = db;
    this.logger = new Logger('Scheduler');
  }

  /**
   * Execute daily prompt delivery to all active users
   * Requirements: 6.1, 6.2, 6.3, 6.4
   *
   * This method:
   * 1. Retrieves all active users (Requirement 6.1)
   * 2. Groups users by skill level and language
   * 3. Generates one prompt per unique combination (Requirement 6.2)
   * 4. Sends prompts to users via WhatsApp (Requirement 6.3)
   * 5. Continues processing on failures (Requirement 6.4)
   *
   * @returns Promise<DeliveryReport> - Report with delivery statistics
   */
  async executeDailyDelivery(): Promise<DeliveryReport> {
    const startTime = Date.now();
    this.logger.info('Starting daily prompt delivery');

    try {
      // Step 1: Retrieve all active users (Requirement 6.1)
      const activeUsers = await this.userRepository.getAllActiveUsers();
      this.logger.info('Retrieved active users', { count: activeUsers.length });

      if (activeUsers.length === 0) {
        this.logger.info('No active users found, skipping delivery');
        return this.createEmptyReport(startTime);
      }

      // Step 2: Generate prompts for all unique skill-language combinations (Requirement 6.2)
      const prompts = await this.generatePromptsForAllCombinations(activeUsers);
      this.logger.info('Generated prompts for combinations', { count: prompts.size });

      // Step 3: Send prompts to users (Requirements 6.3, 6.4)
      const deliveryResult = await this.sendPromptsToUsers(activeUsers, prompts);

      const executionTime = Date.now() - startTime;
      this.logger.info('Daily delivery completed', {
        totalUsers: activeUsers.length,
        successCount: deliveryResult.totalSent,
        failureCount: deliveryResult.totalFailed,
        executionTimeMs: executionTime,
      });

      // Log delivery report to database (Requirement 11.3)
      await logDeliveryReport(this.db, {
        totalUsers: activeUsers.length,
        successCount: deliveryResult.totalSent,
        failureCount: deliveryResult.totalFailed,
        promptsGenerated: prompts.size,
        imagesGenerated: prompts.size,
        executionTime,
      });

      return {
        timestamp: new Date(),
        totalUsers: activeUsers.length,
        successCount: deliveryResult.totalSent,
        failureCount: deliveryResult.totalFailed,
        promptsGenerated: prompts.size,
        imagesGenerated: prompts.size,
        apiUsage: {
          perplexityTokens: 0, // TODO: Track in future implementation
          imageGenerations: prompts.size,
          whatsappMessages: activeUsers.length,
        },
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.logger.error('Error in daily delivery', {
        error: error instanceof Error ? error.message : String(error),
        executionTimeMs: executionTime,
      });
      throw error;
    }
  }

  /**
   * Generate prompts for all unique skill level and language combinations
   * Requirement 6.2: Generate a unique painting prompt for each skill level
   *
   * @param users - Array of active users
   * @returns Promise<Map<string, PaintingPrompt>> - Map of combination key to prompt
   */
  async generatePromptsForAllCombinations(
    users: Array<{ skillLevel: SkillLevel; language: Language }>
  ): Promise<Map<string, PaintingPrompt>> {
    // Find all unique skill-language combinations
    const combinations = new Set<string>();
    for (const user of users) {
      const key = this.getCombinationKey(user.skillLevel, user.language);
      combinations.add(key);
    }

    this.logger.info('Found unique combinations', { count: combinations.size });

    // Generate one prompt for each combination
    const prompts = new Map<string, PaintingPrompt>();

    for (const combinationKey of combinations) {
      const [skillLevel, language] = this.parseCombinationKey(combinationKey);

      try {
        this.logger.info('Generating prompt for combination', { skillLevel, language });

        // Use generatePromptWithRetry to ensure we always get a prompt (with fallback if needed)
        const prompt = await this.promptGenerator.generatePromptWithRetry(
          skillLevel,
          language,
          3
        );

        prompts.set(combinationKey, prompt);
        this.logger.info('Successfully generated prompt', { skillLevel, language });
      } catch (error) {
        // This should not happen since generatePromptWithRetry has fallback
        // But log it just in case
        this.logger.error('Failed to generate prompt even with fallback', {
          skillLevel,
          language,
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    }

    return prompts;
  }

  /**
   * Send prompts to all users via WhatsApp bulk messaging
   * Requirements 6.3, 6.4: Send prompts and continue on failures
   *
   * @param users - Array of active users
   * @param prompts - Map of combination key to prompt
   * @returns Promise<BulkSendResult> - Result with success/failure counts
   */
  async sendPromptsToUsers(
    users: Array<{ phoneNumber: string; skillLevel: SkillLevel; language: Language }>,
    prompts: Map<string, PaintingPrompt>
  ): Promise<{ totalSent: number; totalFailed: number; failures: Array<{ phoneNumber: string; error: string }> }> {
    // Build messages array for bulk sending
    const messages = users.map((user) => {
      const key = this.getCombinationKey(user.skillLevel, user.language);
      const prompt = prompts.get(key);

      if (!prompt) {
        this.logger.error('No prompt found for user combination', {
          phoneNumber: user.phoneNumber,
          skillLevel: user.skillLevel,
          language: user.language,
        });
        throw new Error(`No prompt found for combination: ${key}`);
      }

      return {
        phoneNumber: user.phoneNumber,
        message: prompt.text,
        imageUrl: prompt.imageUrl,
      };
    });

    this.logger.info('Sending bulk messages', { count: messages.length });

    // Send all messages via WhatsApp bulk API
    // This will continue processing even if individual messages fail (Requirement 6.4)
    const result = await this.whatsappClient.sendBulkMessages(messages);

    this.logger.info('Bulk send completed', {
      totalSent: result.totalSent,
      totalFailed: result.totalFailed,
      failureCount: result.failures.length,
    });

    // Update last_prompt_sent timestamp for successfully sent messages
    for (const user of users) {
      const failed = result.failures.some((f) => f.phoneNumber === user.phoneNumber);
      if (!failed) {
        try {
          await this.userRepository.updateLastPromptSent(user.phoneNumber);
        } catch (error) {
          // Log but don't fail the entire operation
          this.logger.error('Failed to update last_prompt_sent', {
            phoneNumber: user.phoneNumber,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    }

    return result;
  }

  /**
   * Create a combination key from skill level and language
   * @param skillLevel - User's skill level
   * @param language - User's language preference
   * @returns string - Combination key (e.g., "beginner-ro")
   */
  private getCombinationKey(skillLevel: SkillLevel, language: Language): string {
    return `${skillLevel}-${language}`;
  }

  /**
   * Parse a combination key back into skill level and language
   * @param key - Combination key (e.g., "beginner-ro")
   * @returns [SkillLevel, Language] - Tuple of skill level and language
   */
  private parseCombinationKey(key: string): [SkillLevel, Language] {
    const [skillLevel, language] = key.split('-');
    return [skillLevel as SkillLevel, language as Language];
  }

  /**
   * Create an empty delivery report when no users are active
   * @param startTime - Start time of the delivery process
   * @returns DeliveryReport - Empty report
   */
  private createEmptyReport(startTime: number): DeliveryReport {
    return {
      timestamp: new Date(),
      totalUsers: 0,
      successCount: 0,
      failureCount: 0,
      promptsGenerated: 0,
      imagesGenerated: 0,
      apiUsage: {
        perplexityTokens: 0,
        imageGenerations: 0,
        whatsappMessages: 0,
      },
    };
  }
}
