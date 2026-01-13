import { google } from 'googleapis';
import * as fs from 'fs';
import * as path from 'path';
import { TransactionModel } from '../models/Transaction';
import { CategoryModel } from '../models/Category';
import db from '../database';

const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];
const TOKEN_PATH = path.join(process.cwd(), 'token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');

interface ParsedTransaction {
  amount: number;
  currency: 'NGN' | 'USD';
  description: string;
  transaction_date: string;
  transaction_type: 'income' | 'expense';
  merchant?: string;
}

/**
 * Gmail Service for extracting transaction data from emails
 */
export class GmailService {
  private oauth2Client: any;

  constructor() {
    this.oauth2Client = null;
  }

  /**
   * Initialize OAuth2 client
   */
  async initialize() {
    if (!fs.existsSync(CREDENTIALS_PATH)) {
      throw new Error(
        'Gmail credentials not found. Please set up OAuth2 credentials from Google Cloud Console.'
      );
    }

    const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf-8'));
    const { client_id, client_secret, redirect_uris } = credentials.installed || credentials.web;

    this.oauth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

    // Check if we have a token
    if (fs.existsSync(TOKEN_PATH)) {
      const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf-8'));
      this.oauth2Client.setCredentials(token);
    }
  }

  /**
   * Get authorization URL for user to grant access
   */
  getAuthUrl(): string {
    if (!this.oauth2Client) {
      throw new Error('OAuth2 client not initialized');
    }

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
    });
  }

  /**
   * Exchange authorization code for tokens
   */
  async getToken(code: string) {
    if (!this.oauth2Client) {
      throw new Error('OAuth2 client not initialized');
    }

    const { tokens } = await this.oauth2Client.getToken(code);
    this.oauth2Client.setCredentials(tokens);

    // Save token to disk
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));

    return tokens;
  }

  /**
   * Check if authenticated
   */
  isAuthenticated(): boolean {
    return this.oauth2Client && this.oauth2Client.credentials.access_token;
  }

  /**
   * Search for transaction emails
   */
  async searchTransactionEmails(query: string = 'transaction OR payment OR debit OR credit', maxResults: number = 50) {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated with Gmail');
    }

    const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });

    try {
      const response = await gmail.users.messages.list({
        userId: 'me',
        q: query,
        maxResults,
      });

      return response.data.messages || [];
    } catch (error) {
      console.error('Error searching emails:', error);
      throw error;
    }
  }

  /**
   * Get email content by ID
   */
  async getEmailContent(messageId: string) {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated with Gmail');
    }

    const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });

    try {
      const response = await gmail.users.messages.get({
        userId: 'me',
        id: messageId,
        format: 'full',
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching email:', error);
      throw error;
    }
  }

  /**
   * Extract text from email
   */
  private extractEmailText(message: any): string {
    let text = '';

    if (message.payload.body.data) {
      text = Buffer.from(message.payload.body.data, 'base64').toString('utf-8');
    } else if (message.payload.parts) {
      for (const part of message.payload.parts) {
        if (part.mimeType === 'text/plain' && part.body.data) {
          text += Buffer.from(part.body.data, 'base64').toString('utf-8');
        }
      }
    }

    return text;
  }

  /**
   * Parse transaction from email text
   * This is a basic parser - you'll need to customize it for specific banks
   */
  private parseTransaction(emailText: string, subject: string): ParsedTransaction | null {
    // Common patterns for Nigerian banks
    const patterns = [
      // Pattern for debit transactions
      /(?:Debit|Debited|DR|Withdrawal).*?(?:NGN|₦|N)\s*([\d,]+\.?\d*)/i,
      /(?:Debit|Debited|DR|Withdrawal).*?\$\s*([\d,]+\.?\d*)/i,
      // Pattern for credit transactions
      /(?:Credit|Credited|CR|Deposit).*?(?:NGN|₦|N)\s*([\d,]+\.?\d*)/i,
      /(?:Credit|Credited|CR|Deposit).*?\$\s*([\d,]+\.?\d*)/i,
      // General amount pattern
      /Amount:\s*(?:NGN|₦|N|\$)\s*([\d,]+\.?\d*)/i,
    ];

    let amount: number | null = null;
    let currency: 'NGN' | 'USD' = 'NGN';
    let transactionType: 'income' | 'expense' = 'expense';

    // Determine transaction type
    if (/credit|credited|deposit|received/i.test(emailText) || /credit|credited|deposit|received/i.test(subject)) {
      transactionType = 'income';
    }

    // Extract amount and currency
    for (const pattern of patterns) {
      const match = emailText.match(pattern);
      if (match) {
        amount = parseFloat(match[1].replace(/,/g, ''));

        // Determine currency
        if (/\$|USD|Dollar/i.test(match[0])) {
          currency = 'USD';
        }
        break;
      }
    }

    if (!amount) return null;

    // Extract merchant/description
    const merchantMatch = emailText.match(/(?:at|from|to)\s+([A-Z][A-Za-z0-9\s&-]+?)(?:\s+on|\s+at|\s+for|\.)/);
    const merchant = merchantMatch ? merchantMatch[1].trim() : subject;

    // Extract date (default to now if not found)
    const date = new Date().toISOString().split('T')[0];

    return {
      amount,
      currency,
      description: merchant.substring(0, 255),
      transaction_date: date,
      transaction_type: transactionType,
      merchant,
    };
  }

  /**
   * Sync transactions from Gmail
   */
  async syncTransactions(maxEmails: number = 50): Promise<{ imported: number; skipped: number; errors: number }> {
    const stats = { imported: 0, skipped: 0, errors: 0 };

    try {
      // Get last sync state
      const syncState = db.prepare('SELECT * FROM gmail_sync_state WHERE id = 1').get() as any;

      // Search for transaction emails
      const messages = await this.searchTransactionEmails(
        'transaction OR payment OR debit OR credit OR purchase',
        maxEmails
      );

      console.log(`Found ${messages.length} potential transaction emails`);

      for (const message of messages) {
        try {
          const emailContent = await this.getEmailContent(message.id!);
          const subject = emailContent.payload?.headers?.find((h: any) => h.name === 'Subject')?.value || '';
          const text = this.extractEmailText(emailContent);

          // Check if already processed
          const existing = db.prepare(
            'SELECT id FROM transactions WHERE source = ? AND source_id = ?'
          ).get('gmail', message.id);

          if (existing) {
            stats.skipped++;
            continue;
          }

          const parsed = this.parseTransaction(text, subject);

          if (!parsed) {
            stats.skipped++;
            continue;
          }

          // Try to categorize
          let categoryId: number | undefined;
          if (parsed.merchant) {
            // Simple categorization logic
            const merchantLower = parsed.merchant.toLowerCase();
            if (/restaurant|food|kitchen|cafe|pizza|burger/i.test(merchantLower)) {
              const category = CategoryModel.findByName('Food & Dining');
              categoryId = category?.id;
            } else if (/uber|taxi|transport|fuel|petrol/i.test(merchantLower)) {
              const category = CategoryModel.findByName('Transportation');
              categoryId = category?.id;
            } else if (/shop|store|market|mall/i.test(merchantLower)) {
              const category = CategoryModel.findByName('Shopping');
              categoryId = category?.id;
            }
          }

          // Create transaction
          TransactionModel.create({
            ...parsed,
            category_id: categoryId,
            source: 'gmail',
            source_id: message.id,
          });

          stats.imported++;
        } catch (error) {
          console.error(`Error processing email ${message.id}:`, error);
          stats.errors++;
        }
      }

      // Update sync state
      db.prepare(`
        INSERT OR REPLACE INTO gmail_sync_state (id, last_sync_time)
        VALUES (1, CURRENT_TIMESTAMP)
      `).run();

      return stats;
    } catch (error) {
      console.error('Error syncing Gmail transactions:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const gmailService = new GmailService();
