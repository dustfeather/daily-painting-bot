/**
 * WhatsApp API Client
 * Handles communication with WhatsApp Business API for sending messages
 */

import type { SendResult, BulkSendResult, WhatsAppSendMessageResponse } from '../types';
import { Logger } from '../utils/logger';
import { logApiUsage } from './api-logger';

const logger = new Logger('WhatsAppClient');

export class WhatsAppClient {
  private readonly apiUrl: string;
  private readonly apiToken: string;
  private readonly phoneNumberId: string;
  private readonly db: D1Database | null;

  constructor(apiUrl: string, apiToken: string, phoneNumberId: string, db: D1Database | null = null) {
    this.apiUrl = apiUrl;
    this.apiToken = apiToken;
    this.phoneNumberId = phoneNumberId;
    this.db = db;
  }

  /**
   * Send a text-only message to a phone number
   * @param phoneNumber - Recipient phone number (E.164 format)
   * @param message - Text message to send
   * @returns SendResult with success status and message ID or error
   */
  async sendMessage(phoneNumber: string, message: string): Promise<SendResult> {
    try {
      const url = `${this.apiUrl}/${this.phoneNumberId}/messages`;

      const payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: phoneNumber,
        type: 'text',
        text: {
          preview_url: false,
          body: message,
        },
      };

      logger.info('Sending WhatsApp text message', { phoneNumber });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('WhatsApp API error', {
          status: response.status,
          error: errorText,
          phoneNumber
        });

        // Log failed API usage
        if (this.db) {
          await logApiUsage(this.db, {
            service: 'whatsapp',
            operation: 'send_message',
            messagesSent: 0,
            success: false,
            error: `${response.status} - ${errorText}`,
          });
        }

        return {
          success: false,
          error: `WhatsApp API error: ${response.status} - ${errorText}`,
        };
      }

      const data = await response.json() as WhatsAppSendMessageResponse;
      const messageId = data.messages?.[0]?.id;

      logger.info('WhatsApp message sent successfully', { phoneNumber, messageId });

      // Log successful API usage
      if (this.db) {
        await logApiUsage(this.db, {
          service: 'whatsapp',
          operation: 'send_message',
          messagesSent: 1,
          success: true,
        });
      }

      return {
        success: true,
        messageId,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to send WhatsApp message', { phoneNumber, error: errorMessage });

      // Log failed API usage
      if (this.db) {
        await logApiUsage(this.db, {
          service: 'whatsapp',
          operation: 'send_message',
          messagesSent: 0,
          success: false,
          error: errorMessage,
        });
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Send a message with an image to a phone number
   * @param phoneNumber - Recipient phone number (E.164 format)
   * @param message - Text message to send (caption)
   * @param imageUrl - URL of the image to send
   * @returns SendResult with success status and message ID or error
   */
  async sendMessageWithImage(
    phoneNumber: string,
    message: string,
    imageUrl: string
  ): Promise<SendResult> {
    try {
      const url = `${this.apiUrl}/${this.phoneNumberId}/messages`;

      const payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: phoneNumber,
        type: 'image',
        image: {
          link: imageUrl,
          caption: message,
        },
      };

      logger.info('Sending WhatsApp message with image', { phoneNumber, imageUrl });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('WhatsApp API error', {
          status: response.status,
          error: errorText,
          phoneNumber
        });

        // Log failed API usage
        if (this.db) {
          await logApiUsage(this.db, {
            service: 'whatsapp',
            operation: 'send_message_with_image',
            messagesSent: 0,
            success: false,
            error: `${response.status} - ${errorText}`,
          });
        }

        return {
          success: false,
          error: `WhatsApp API error: ${response.status} - ${errorText}`,
        };
      }

      const data = await response.json() as WhatsAppSendMessageResponse;
      const messageId = data.messages?.[0]?.id;

      logger.info('WhatsApp message with image sent successfully', {
        phoneNumber,
        messageId
      });

      // Log successful API usage
      if (this.db) {
        await logApiUsage(this.db, {
          service: 'whatsapp',
          operation: 'send_message_with_image',
          messagesSent: 1,
          success: true,
        });
      }

      return {
        success: true,
        messageId,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to send WhatsApp message with image', {
        phoneNumber,
        error: errorMessage
      });

      // Log failed API usage
      if (this.db) {
        await logApiUsage(this.db, {
          service: 'whatsapp',
          operation: 'send_message_with_image',
          messagesSent: 0,
          success: false,
          error: errorMessage,
        });
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Send messages to multiple recipients in batch
   * Continues processing even if individual messages fail
   * @param messages - Array of messages to send
   * @returns BulkSendResult with counts and failure details
   */
  async sendBulkMessages(
    messages: Array<{ phoneNumber: string; message: string; imageUrl?: string }>
  ): Promise<BulkSendResult> {
    logger.info('Starting bulk message send', { totalMessages: messages.length });

    let totalSent = 0;
    let totalFailed = 0;
    const failures: Array<{ phoneNumber: string; error: string }> = [];

    for (const msg of messages) {
      try {
        const result = msg.imageUrl
          ? await this.sendMessageWithImage(msg.phoneNumber, msg.message, msg.imageUrl)
          : await this.sendMessage(msg.phoneNumber, msg.message);

        if (result.success) {
          totalSent++;
        } else {
          totalFailed++;
          failures.push({
            phoneNumber: msg.phoneNumber,
            error: result.error || 'Unknown error',
          });
        }
      } catch (error) {
        // Catch any unexpected errors and continue processing
        totalFailed++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        failures.push({
          phoneNumber: msg.phoneNumber,
          error: errorMessage,
        });
        logger.error('Unexpected error in bulk send', {
          phoneNumber: msg.phoneNumber,
          error: errorMessage
        });
      }
    }

    logger.info('Bulk message send completed', { totalSent, totalFailed });

    // Log bulk operation summary
    if (this.db) {
      await logApiUsage(this.db, {
        service: 'whatsapp',
        operation: 'send_bulk_messages',
        messagesSent: totalSent,
        success: totalFailed === 0,
        error: totalFailed > 0 ? `${totalFailed} messages failed` : undefined,
      });
    }

    return {
      totalSent,
      totalFailed,
      failures,
    };
  }
}
