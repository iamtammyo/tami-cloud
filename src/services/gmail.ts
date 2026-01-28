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
  currency: 'NGN' | 'USD' | 'GBP' | 'EUR';
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
   * Enhanced parser for Standard Chartered, Kuda Bank, and other Nigerian banks
   * Supports NGN, USD, GBP, and EUR
   */
  private parseTransaction(emailText: string, subject: string): ParsedTransaction | null {
    // Enhanced patterns for multiple banks and currencies
    const patterns = [
      // Standard Chartered Bank patterns
      /(?:Debit|Debited|DR).*?(?:NGN|₦|N)\s*([\d,]+\.?\d*)/i,
      /(?:Debit|Debited|DR).*?\$\s*([\d,]+\.?\d*)/i,
      /(?:Debit|Debited|DR).*?(?:GBP|£)\s*([\d,]+\.?\d*)/i,
      /(?:Debit|Debited|DR).*?(?:EUR|€)\s*([\d,]+\.?\d*)/i,
      /(?:Credit|Credited|CR).*?(?:NGN|₦|N)\s*([\d,]+\.?\d*)/i,
      /(?:Credit|Credited|CR).*?\$\s*([\d,]+\.?\d*)/i,
      /(?:Credit|Credited|CR).*?(?:GBP|£)\s*([\d,]+\.?\d*)/i,
      /(?:Credit|Credited|CR).*?(?:EUR|€)\s*([\d,]+\.?\d*)/i,

      // Kuda Bank patterns (they use different format)
      /(?:sent|paid|transferred).*?(?:NGN|₦|N)\s*([\d,]+\.?\d*)/i,
      /(?:sent|paid|transferred).*?\$\s*([\d,]+\.?\d*)/i,
      /(?:received).*?(?:NGN|₦|N)\s*([\d,]+\.?\d*)/i,
      /(?:received).*?\$\s*([\d,]+\.?\d*)/i,

      // Generic patterns
      /Amount:\s*(?:NGN|₦|N)\s*([\d,]+\.?\d*)/i,
      /Amount:\s*\$\s*([\d,]+\.?\d*)/i,
      /Amount:\s*(?:GBP|£)\s*([\d,]+\.?\d*)/i,
      /Amount:\s*(?:EUR|€)\s*([\d,]+\.?\d*)/i,

      // More flexible patterns
      /(?:NGN|₦|N)\s*([\d,]+\.?\d*)/,
      /\$\s*([\d,]+\.?\d*)/,
      /(?:GBP|£)\s*([\d,]+\.?\d*)/,
      /(?:EUR|€)\s*([\d,]+\.?\d*)/,
    ];

    let amount: number | null = null;
    let currency: 'NGN' | 'USD' | 'GBP' | 'EUR' = 'NGN';
    let transactionType: 'income' | 'expense' = 'expense';

    // Determine transaction type from keywords - be more specific
    const combinedText = `${emailText} ${subject}`.toLowerCase();

    // Count occurrences of income vs expense keywords
    const incomeKeywords = ['credit alert', 'credited', 'credit transaction', 'deposit', 'received', 'incoming', 'payment received', 'salary', 'refund', 'income'];
    const expenseKeywords = ['debit alert', 'debited', 'debit transaction', 'sent', 'paid', 'transferred', 'purchase', 'withdrawal', 'payment'];

    let incomeScore = 0;
    let expenseScore = 0;

    // Score based on keyword matches
    incomeKeywords.forEach(keyword => {
      if (combinedText.includes(keyword)) {
        incomeScore++;
        // Give extra weight to "credit alert" and "credited" in subject
        if (subject.toLowerCase().includes(keyword)) incomeScore += 2;
      }
    });

    expenseKeywords.forEach(keyword => {
      if (combinedText.includes(keyword)) {
        expenseScore++;
        // Give extra weight to "debit alert" and "debited" in subject
        if (subject.toLowerCase().includes(keyword)) expenseScore += 2;
      }
    });

    // Determine type based on score
    if (incomeScore > expenseScore) {
      transactionType = 'income';
    } else {
      transactionType = 'expense';
    }

    // Extract amount and currency
    for (const pattern of patterns) {
      const match = emailText.match(pattern);
      if (match) {
        const amountStr = match[1].replace(/,/g, '');
        const parsedAmount = parseFloat(amountStr);

        // Only use if it's a valid number greater than 0
        if (!isNaN(parsedAmount) && parsedAmount > 0) {
          amount = parsedAmount;

          // Determine currency from the match
          const matchText = match[0];
          if (/\$|USD|Dollar/i.test(matchText)) {
            currency = 'USD';
          } else if (/£|GBP|Pound/i.test(matchText)) {
            currency = 'GBP';
          } else if (/€|EUR|Euro/i.test(matchText)) {
            currency = 'EUR';
          } else if (/NGN|₦|N\s/i.test(matchText)) {
            currency = 'NGN';
          }

          break;
        }
      }
    }

    if (!amount) return null;

    // Extract merchant/description with better patterns
    let merchant = '';

    // Try multiple merchant extraction patterns
    const merchantPatterns = [
      /(?:at|from|to|via)\s+([A-Z][A-Za-z0-9\s&.\-']+?)(?:\s+on|\s+at|\.|,|\s+for)/i,
      /(?:merchant|vendor|payee):\s*([A-Za-z0-9\s&.\-']+?)(?:\.|,|$)/i,
      /(?:Reference|Narration):\s*([A-Za-z0-9\s&.\-']+?)(?:\.|,|$)/i,
    ];

    for (const pattern of merchantPatterns) {
      const match = emailText.match(pattern);
      if (match && match[1]) {
        merchant = match[1].trim();
        break;
      }
    }

    // Fallback to subject if no merchant found
    if (!merchant) {
      merchant = subject.replace(/^(Transaction Alert|Debit Alert|Credit Alert|Payment|Transfer)\s*[:|-]?\s*/i, '').trim();
    }

    // Clean up merchant name
    merchant = merchant.substring(0, 255);
    if (!merchant) merchant = 'Transaction';

    // Extract date with better patterns
    let transactionDate = new Date().toISOString().split('T')[0];

    const datePatterns = [
      /(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/,
      /(\d{4}[-/]\d{1,2}[-/]\d{1,2})/,
      /on\s+(\d{1,2}\s+[A-Za-z]{3,9}\s+\d{2,4})/i,
    ];

    for (const pattern of datePatterns) {
      const match = emailText.match(pattern);
      if (match) {
        try {
          const parsedDate = new Date(match[1]);
          if (!isNaN(parsedDate.getTime())) {
            transactionDate = parsedDate.toISOString().split('T')[0];
            break;
          }
        } catch (e) {
          // Continue to next pattern if this one fails
        }
      }
    }

    return {
      amount,
      currency,
      description: merchant,
      transaction_date: transactionDate,
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

      // Search for transaction emails ONLY from specific bank addresses
      // Only search emails from January 1st, 2026 onwards
      const messages = await this.searchTransactionEmails(
        'after:2026/01/01 (from:no-reply@kuda.com OR from:alerts.nigeria@sc.com) (transaction OR "transaction alert" OR "transaction notification" OR alert)',
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
            console.log(`Skipped email (no transaction found): ${subject.substring(0, 50)}`);
            stats.skipped++;
            continue;
          }

          // Log what we parsed for debugging
          console.log(`Parsed transaction: ${parsed.transaction_type} ${parsed.currency} ${parsed.amount} - ${parsed.description.substring(0, 30)}`);

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
            source_id: message.id || undefined,
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
