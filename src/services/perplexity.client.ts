/**
 * Perplexity AI Client for text and image generation
 * Handles API communication with Perplexity AI for generating painting prompts and images
 */

import { SkillLevel, Language, PerplexityTextResponse, PerplexityImageResponse } from '../types';
import { Logger } from '../utils/logger';
import { logApiUsage } from './api-logger';

export class PerplexityClient {
  private apiUrl: string;
  private apiKey: string;
  private textModel: string;
  private imageModel: string;
  private maxTokens: number;
  private maxRetries: number;
  private retryDelayMs: number;
  private logger: Logger;
  private db: D1Database | null;

  constructor(
    apiUrl: string,
    apiKey: string,
    textModel: string,
    imageModel: string,
    maxTokens: number = 500,
    maxRetries: number = 3,
    retryDelayMs: number = 1000,
    db: D1Database | null = null
  ) {
    this.apiUrl = apiUrl;
    this.apiKey = apiKey;
    this.textModel = textModel;
    this.imageModel = imageModel;
    this.maxTokens = maxTokens;
    this.maxRetries = maxRetries;
    this.retryDelayMs = retryDelayMs;
    this.logger = new Logger('PerplexityClient');
    this.db = db;
  }

  /**
   * Generate a painting prompt text based on skill level and language
   * Implements exponential backoff retry logic
   *
   * @param skillLevel - User's skill level (beginner, intermediate, advanced)
   * @param language - User's preferred language
   * @returns Promise<string> - Generated painting prompt text
   */
  async generateTextPrompt(skillLevel: SkillLevel, language: Language): Promise<string> {
    const prompt = this.buildPrompt(skillLevel, language);

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        this.logger.info(`Generating text prompt (attempt ${attempt + 1}/${this.maxRetries})`, {
          skillLevel,
          language,
        });

        const response = await this.callPerplexityAPI(prompt);
        const extractedText = this.extractPaintingIdea(response);

        this.logger.info('Successfully generated text prompt', {
          skillLevel,
          language,
          textLength: extractedText.length,
        });

        // Log successful API usage
        if (this.db) {
          await logApiUsage(this.db, {
            service: 'perplexity',
            operation: 'generate_text_prompt',
            tokensUsed: response.usage?.total_tokens,
            success: true,
          });
        }

        return extractedText;
      } catch (error) {
        const isLastAttempt = attempt === this.maxRetries - 1;

        this.logger.error(`Failed to generate text prompt (attempt ${attempt + 1}/${this.maxRetries})`, {
          error: error instanceof Error ? error.message : String(error),
          skillLevel,
          language,
        });

        if (isLastAttempt) {
          // Log failed API usage
          if (this.db) {
            await logApiUsage(this.db, {
              service: 'perplexity',
              operation: 'generate_text_prompt',
              success: false,
              error: error instanceof Error ? error.message : String(error),
            });
          }

          throw new Error(
            `Failed to generate text prompt after ${this.maxRetries} attempts: ${
              error instanceof Error ? error.message : String(error)
            }`
          );
        }

        // Exponential backoff: 1s, 2s, 4s
        const delay = this.retryDelayMs * Math.pow(2, attempt);
        this.logger.info(`Retrying after ${delay}ms delay`);
        await this.sleep(delay);
      }
    }

    // This should never be reached due to the throw in the last attempt
    throw new Error('Unexpected error in retry logic');
  }

  /**
   * Build the prompt for Perplexity AI based on skill level and language
   */
  private buildPrompt(skillLevel: SkillLevel, language: Language): string {
    const langPrefix = language === 'ro' ? 'În română: ' : '';
    const skillContext = this.getSkillContext(skillLevel);

    return `${langPrefix}${skillContext} painting idea in 2 sentences.`;
  }

  /**
   * Get skill-level-specific context
   */
  private getSkillContext(skillLevel: SkillLevel): string {
    const contexts: Record<SkillLevel, string> = {
      beginner: 'Simple',
      intermediate: 'Moderate',
      advanced: 'Complex',
    };

    return contexts[skillLevel];
  }

  /**
   * Call Perplexity AI API
   */
  private async callPerplexityAPI(prompt: string): Promise<PerplexityTextResponse> {
    const url = `${this.apiUrl}/chat/completions`;

    const requestBody = {
      model: this.textModel,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: this.maxTokens,
      temperature: 0.7,
    };

    this.logger.debug('Calling Perplexity API', { url, model: this.textModel });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Perplexity API request failed with status ${response.status}: ${errorText}`
      );
    }

    const data = await response.json<PerplexityTextResponse>();
    return data;
  }

  /**
   * Extract painting idea from Perplexity API response
   */
  private extractPaintingIdea(response: PerplexityTextResponse): string {
    if (!response.choices || response.choices.length === 0) {
      throw new Error('No choices in Perplexity API response');
    }

    const content = response.choices[0]?.message?.content;

    if (!content || typeof content !== 'string') {
      throw new Error('Invalid or empty content in Perplexity API response');
    }

    const trimmedContent = content.trim();

    if (trimmedContent.length === 0) {
      throw new Error('Empty painting idea after trimming');
    }

    return trimmedContent;
  }

  /**
   * Generate an image based on the text prompt, skill level, and language
   * Implements exponential backoff retry logic
   *
   * @param promptText - The text prompt to base the image on
   * @param skillLevel - User's skill level (beginner, intermediate, advanced)
   * @param language - User's preferred language
   * @returns Promise<string> - URL of the generated image
   */
  async generateImage(
    promptText: string,
    skillLevel: SkillLevel,
    language: Language
  ): Promise<string> {
    const visualKeywords = this.extractVisualKeywords(promptText);
    const imagePrompt = this.buildImagePrompt(visualKeywords, skillLevel, language);

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        this.logger.info(`Generating image (attempt ${attempt + 1}/${this.maxRetries})`, {
          skillLevel,
          language,
          visualKeywords,
        });

        const imageUrl = await this.callPerplexityImageAPI(imagePrompt);

        this.logger.info('Successfully generated image', {
          skillLevel,
          language,
          imageUrl,
        });

        // Log successful API usage
        if (this.db) {
          await logApiUsage(this.db, {
            service: 'image_generation',
            operation: 'generate_image',
            imagesGenerated: 1,
            success: true,
          });
        }

        return imageUrl;
      } catch (error) {
        const isLastAttempt = attempt === this.maxRetries - 1;

        this.logger.error(`Failed to generate image (attempt ${attempt + 1}/${this.maxRetries})`, {
          error: error instanceof Error ? error.message : String(error),
          skillLevel,
          language,
        });

        if (isLastAttempt) {
          // Log failed API usage
          if (this.db) {
            await logApiUsage(this.db, {
              service: 'image_generation',
              operation: 'generate_image',
              success: false,
              error: error instanceof Error ? error.message : String(error),
            });
          }

          throw new Error(
            `Failed to generate image after ${this.maxRetries} attempts: ${
              error instanceof Error ? error.message : String(error)
            }`
          );
        }

        // Exponential backoff: 1s, 2s, 4s
        const delay = this.retryDelayMs * Math.pow(2, attempt);
        this.logger.info(`Retrying after ${delay}ms delay`);
        await this.sleep(delay);
      }
    }

    // This should never be reached due to the throw in the last attempt
    throw new Error('Unexpected error in retry logic');
  }

  /**
   * Extract visual keywords from the text prompt
   * Identifies key subjects, styles, and techniques mentioned in the text
   */
  private extractVisualKeywords(promptText: string): string {
    // Remove common filler words and extract meaningful visual terms
    const fillerWords = [
      'the',
      'a',
      'an',
      'and',
      'or',
      'but',
      'in',
      'on',
      'at',
      'to',
      'for',
      'of',
      'with',
      'by',
      'from',
      'up',
      'about',
      'into',
      'through',
      'during',
      'before',
      'after',
      'above',
      'below',
      'between',
      'under',
      'again',
      'further',
      'then',
      'once',
      'here',
      'there',
      'when',
      'where',
      'why',
      'how',
      'all',
      'both',
      'each',
      'few',
      'more',
      'most',
      'other',
      'some',
      'such',
      'only',
      'own',
      'same',
      'so',
      'than',
      'too',
      'very',
      'can',
      'will',
      'just',
      'should',
      'now',
    ];

    // Split into words and filter
    const words = promptText
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((word) => word.length > 3 && !fillerWords.includes(word));

    // Take the most important words (first 10 unique words)
    const uniqueWords = [...new Set(words)].slice(0, 10);

    return uniqueWords.join(' ');
  }

  /**
   * Build an image generation prompt with skill-appropriate styling
   */
  private buildImagePrompt(
    visualKeywords: string,
    skillLevel: SkillLevel,
    language: Language
  ): string {
    const styleContext = this.getImageStyleContext(skillLevel);

    // Create a concise image generation prompt
    return `${visualKeywords}, ${styleContext}, artistic painting reference`;
  }

  /**
   * Get skill-level-specific styling context for image generation
   */
  private getImageStyleContext(skillLevel: SkillLevel): string {
    const contexts: Record<SkillLevel, string> = {
      beginner: 'simple, clear, basic composition, easy to follow',
      intermediate: 'moderate complexity, interesting techniques, artistic',
      advanced: 'sophisticated, complex composition, conceptual, artistic mastery',
    };

    return contexts[skillLevel];
  }

  /**
   * Call Perplexity AI Image Generation API
   */
  private async callPerplexityImageAPI(prompt: string): Promise<string> {
    const url = `${this.apiUrl}/images/generations`;

    const requestBody = {
      model: this.imageModel,
      prompt: prompt,
      n: 1,
      size: '1024x1024',
    };

    this.logger.debug('Calling Perplexity Image API', { url, model: this.imageModel });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Perplexity Image API request failed with status ${response.status}: ${errorText}`
      );
    }

    const data = await response.json<PerplexityImageResponse>();

    if (!data.data || data.data.length === 0) {
      throw new Error('No images in Perplexity Image API response');
    }

    const imageUrl = data.data[0]?.url;

    if (!imageUrl || typeof imageUrl !== 'string') {
      throw new Error('Invalid or empty image URL in Perplexity Image API response');
    }

    return imageUrl;
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
