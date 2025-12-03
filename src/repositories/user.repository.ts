import { User, SkillLevel, Language } from '../types';

/**
 * UserRepository handles all database operations for user management
 * Uses parameterized queries to prevent SQL injection (Requirement 10.1)
 */
export class UserRepository {
  constructor(private db: D1Database) {}

  /**
   * Create a new user subscription
   * Requirements: 1.2 - Store user's phone number and skill level
   */
  async createUser(
    phoneNumber: string,
    skillLevel: SkillLevel,
    language: Language
  ): Promise<User> {
    const now = new Date().toISOString();

    await this.db
      .prepare(
        `INSERT INTO users (phone_number, skill_level, language, subscribed_at, is_active, created_at, updated_at)
         VALUES (?, ?, ?, ?, 1, ?, ?)`
      )
      .bind(phoneNumber, skillLevel, language, now, now, now)
      .run();

    return {
      phoneNumber,
      skillLevel,
      language,
      subscribedAt: new Date(now),
      lastPromptSent: null,
      isActive: true,
    };
  }

  /**
   * Retrieve a user by phone number
   */
  async getUser(phoneNumber: string): Promise<User | null> {
    const result = await this.db
      .prepare('SELECT * FROM users WHERE phone_number = ?')
      .bind(phoneNumber)
      .first<{
        phone_number: string;
        skill_level: SkillLevel;
        language: Language;
        subscribed_at: string;
        last_prompt_sent: string | null;
        is_active: number;
      }>();

    if (!result) {
      return null;
    }

    return this.mapRowToUser(result);
  }

  /**
   * Update a user's skill level
   * Requirements: 3.2 - Update the stored skill level for that user
   */
  async updateSkillLevel(
    phoneNumber: string,
    skillLevel: SkillLevel
  ): Promise<void> {
    const now = new Date().toISOString();

    await this.db
      .prepare(
        'UPDATE users SET skill_level = ?, updated_at = ? WHERE phone_number = ?'
      )
      .bind(skillLevel, now, phoneNumber)
      .run();
  }

  /**
   * Update a user's language preference
   * Requirements: 2.5 - Update the stored language and confirm the change
   */
  async updateLanguage(
    phoneNumber: string,
    language: Language
  ): Promise<void> {
    const now = new Date().toISOString();

    await this.db
      .prepare(
        'UPDATE users SET language = ?, updated_at = ? WHERE phone_number = ?'
      )
      .bind(language, now, phoneNumber)
      .run();
  }

  /**
   * Delete a user (mark as inactive)
   * Requirements: 4.1 - Remove the user from the active subscription list
   * Requirements: 10.3 - Provide a mechanism to permanently delete records
   */
  async deleteUser(phoneNumber: string): Promise<void> {
    await this.db
      .prepare('DELETE FROM users WHERE phone_number = ?')
      .bind(phoneNumber)
      .run();
  }

  /**
   * Mark a user as inactive (soft delete for unsubscribe)
   * Requirements: 4.1 - Remove the user from the active subscription list
   */
  async deactivateUser(phoneNumber: string): Promise<void> {
    const now = new Date().toISOString();

    await this.db
      .prepare(
        'UPDATE users SET is_active = 0, updated_at = ? WHERE phone_number = ?'
      )
      .bind(now, phoneNumber)
      .run();
  }

  /**
   * Get all active users
   * Used for scheduled delivery
   */
  async getAllActiveUsers(): Promise<User[]> {
    const result = await this.db
      .prepare('SELECT * FROM users WHERE is_active = 1')
      .all<{
        phone_number: string;
        skill_level: SkillLevel;
        language: Language;
        subscribed_at: string;
        last_prompt_sent: string | null;
        is_active: number;
      }>();

    return result.results.map((row) => this.mapRowToUser(row));
  }

  /**
   * Get users by skill level and language combination
   * Used for optimized prompt generation during scheduled delivery
   */
  async getUsersBySkillAndLanguage(
    skillLevel: SkillLevel,
    language: Language
  ): Promise<User[]> {
    const result = await this.db
      .prepare(
        'SELECT * FROM users WHERE skill_level = ? AND language = ? AND is_active = 1'
      )
      .bind(skillLevel, language)
      .all<{
        phone_number: string;
        skill_level: SkillLevel;
        language: Language;
        subscribed_at: string;
        last_prompt_sent: string | null;
        is_active: number;
      }>();

    return result.results.map((row) => this.mapRowToUser(row));
  }

  /**
   * Update the last prompt sent timestamp for a user
   */
  async updateLastPromptSent(phoneNumber: string): Promise<void> {
    const now = new Date().toISOString();

    await this.db
      .prepare(
        'UPDATE users SET last_prompt_sent = ?, updated_at = ? WHERE phone_number = ?'
      )
      .bind(now, now, phoneNumber)
      .run();
  }

  /**
   * Helper method to map database row to User object
   */
  private mapRowToUser(row: {
    phone_number: string;
    skill_level: SkillLevel;
    language: Language;
    subscribed_at: string;
    last_prompt_sent: string | null;
    is_active: number;
  }): User {
    return {
      phoneNumber: row.phone_number,
      skillLevel: row.skill_level,
      language: row.language,
      subscribedAt: new Date(row.subscribed_at),
      lastPromptSent: row.last_prompt_sent ? new Date(row.last_prompt_sent) : null,
      isActive: row.is_active === 1,
    };
  }
}
