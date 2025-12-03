/**
 * Prompt Generator Component
 * Orchestrates text and image generation for painting prompts
 * Handles retry logic and fallback mechanisms
 */

import { SkillLevel, Language, PaintingPrompt } from '../types';
import { PerplexityClient } from './perplexity.client';
import { getFallbackPrompt } from './fallback-prompts';
import { Logger } from '../utils/logger';

export class PromptGenerator {
  private perplexityClient: PerplexityClient;
  private logger: Logger;

  constructor(perplexityClient: PerplexityClient) {
    this.perplexityClient = perplexityClient;
    this.logger = new Logger('PromptGenerator');
  }

  /**
   * Generate a complete painting prompt with text and image
   * This is the main entry point for prompt generation
   *
   * @param skillLevel - User's skill level (beginner, intermediate, advanced)
   * @param language - User's preferred language
   * @returns Promise<PaintingPrompt> - Complete prompt with text and image URL
   * @throws Error if generation fails without fallback
   */
  async generatePrompt(skillLevel: SkillLevel, language: Language): Promise<PaintingPrompt> {
    this.logger.info('Generating painting prompt', { skillLevel, language });

    try {
      // Generate text prompt
      const text = await this.perplexityClient.generateTextPrompt(skillLevel, language);

      // Generate image based on the text prompt
      const imageUrl = await this.perplexityClient.generateImage(text, skillLevel, language);

      this.logger.info('Successfully generated complete prompt', {
        skillLevel,
        language,
        textLength: text.length,
        imageUrl,
      });

      return {
        text,
        imageUrl,
        skillLevel,
        language,
      };
    } catch (error) {
      this.logger.error('Failed to generate prompt', {
        error: error instanceof Error ? error.message : String(error),
        skillLevel,
        language,
      });

      throw error;
    }
  }

  /**
   * Generate a painting prompt with retry logic and fallback handling
   * This method ensures a prompt is always returned, even if AI generation fails
   * Note: The maxRetries parameter is included for interface compatibility,
   * but the actual retry logic is handled by the PerplexityClient
   *
   * @param skillLevel - User's skill level (beginner, intermediate, advanced)
   * @param language - User's preferred language
   * @param maxRetries - Maximum number of retry attempts (handled by PerplexityClient)
   * @returns Promise<PaintingPrompt> - Complete prompt with text and image URL
   */
  async generatePromptWithRetry(
    skillLevel: SkillLevel,
    language: Language,
    maxRetries: number = 3
  ): Promise<PaintingPrompt> {
    this.logger.info('Generating painting prompt with retry and fallback', {
      skillLevel,
      language,
      maxRetries,
    });

    try {
      // Attempt to generate prompt using AI
      // Note: Retry logic is built into PerplexityClient
      const prompt = await this.generatePrompt(skillLevel, language);

      this.logger.info('Successfully generated prompt with AI', {
        skillLevel,
        language,
      });

      return prompt;
    } catch (error) {
      // Log the failure
      this.logger.warn('AI generation failed, using fallback prompt', {
        error: error instanceof Error ? error.message : String(error),
        skillLevel,
        language,
      });

      // Return fallback prompt
      const fallbackPrompt = this.getFallbackPrompt(skillLevel, language);

      this.logger.info('Using fallback prompt', {
        skillLevel,
        language,
        fallbackText: fallbackPrompt.text.substring(0, 50) + '...',
      });

      return fallbackPrompt;
    }
  }

  /**
   * Get a fallback prompt for a given skill level and language
   * This is a convenience method that wraps the getFallbackPrompt function
   *
   * @param skillLevel - User's skill level (beginner, intermediate, advanced)
   * @param language - User's preferred language
   * @returns PaintingPrompt - Fallback prompt with text and image URL
   */
  getFallbackPrompt(skillLevel: SkillLevel, language: Language): PaintingPrompt {
    return getFallbackPrompt(skillLevel, language);
  }
}
