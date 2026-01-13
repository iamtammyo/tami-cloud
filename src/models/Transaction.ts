import db from '../database';
import { Transaction, CreateTransactionInput, UpdateTransactionInput } from '../types';

export class TransactionModel {
  static create(data: CreateTransactionInput): Transaction {
    const { tag_ids, ...transactionData } = data;

    const stmt = db.prepare(`
      INSERT INTO transactions (
        amount, currency, description, category_id, transaction_date,
        transaction_type, source, source_id, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      transactionData.amount,
      transactionData.currency,
      transactionData.description,
      transactionData.category_id || null,
      transactionData.transaction_date,
      transactionData.transaction_type,
      transactionData.source || 'manual',
      transactionData.source_id || null,
      transactionData.notes || null
    );

    const transactionId = result.lastInsertRowid as number;

    // Add tags if provided
    if (tag_ids && tag_ids.length > 0) {
      const tagStmt = db.prepare(
        'INSERT INTO transaction_tags (transaction_id, tag_id) VALUES (?, ?)'
      );

      const insertTags = db.transaction((tags: number[]) => {
        for (const tagId of tags) {
          tagStmt.run(transactionId, tagId);
        }
      });

      insertTags(tag_ids);
    }

    return this.findById(transactionId)!;
  }

  static findById(id: number): Transaction | undefined {
    const transaction = db.prepare(`
      SELECT t.*, c.name as category_name, c.color as category_color, c.icon as category_icon
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.id = ?
    `).get(id) as any;

    if (!transaction) return undefined;

    // Get tags
    const tags = db.prepare(`
      SELECT tg.* FROM tags tg
      INNER JOIN transaction_tags tt ON tg.id = tt.tag_id
      WHERE tt.transaction_id = ?
    `).all(id);

    return {
      ...transaction,
      tags: tags as any[],
      category: transaction.category_id ? {
        id: transaction.category_id,
        name: transaction.category_name,
        color: transaction.category_color,
        icon: transaction.category_icon,
      } : undefined,
    };
  }

  static findAll(filters?: {
    currency?: string;
    transaction_type?: string;
    category_id?: number;
    start_date?: string;
    end_date?: string;
    limit?: number;
    offset?: number;
  }): Transaction[] {
    let query = `
      SELECT t.*, c.name as category_name, c.color as category_color, c.icon as category_icon
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filters?.currency) {
      query += ' AND t.currency = ?';
      params.push(filters.currency);
    }

    if (filters?.transaction_type) {
      query += ' AND t.transaction_type = ?';
      params.push(filters.transaction_type);
    }

    if (filters?.category_id) {
      query += ' AND t.category_id = ?';
      params.push(filters.category_id);
    }

    if (filters?.start_date) {
      query += ' AND t.transaction_date >= ?';
      params.push(filters.start_date);
    }

    if (filters?.end_date) {
      query += ' AND t.transaction_date <= ?';
      params.push(filters.end_date);
    }

    query += ' ORDER BY t.transaction_date DESC, t.created_at DESC';

    if (filters?.limit) {
      query += ' LIMIT ?';
      params.push(filters.limit);
    }

    if (filters?.offset) {
      query += ' OFFSET ?';
      params.push(filters.offset);
    }

    const transactions = db.prepare(query).all(...params) as any[];

    return transactions.map(t => {
      const tags = db.prepare(`
        SELECT tg.* FROM tags tg
        INNER JOIN transaction_tags tt ON tg.id = tt.tag_id
        WHERE tt.transaction_id = ?
      `).all(t.id);

      return {
        ...t,
        tags: tags as any[],
        category: t.category_id ? {
          id: t.category_id,
          name: t.category_name,
          color: t.category_color,
          icon: t.category_icon,
        } : undefined,
      };
    });
  }

  static update(id: number, data: UpdateTransactionInput): Transaction | undefined {
    const { tag_ids, ...updateData } = data;
    const fields: string[] = [];
    const values: any[] = [];

    Object.entries(updateData).forEach(([key, value]) => {
      if (value !== undefined) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    });

    if (fields.length > 0) {
      fields.push('updated_at = CURRENT_TIMESTAMP');
      values.push(id);

      const stmt = db.prepare(`
        UPDATE transactions SET ${fields.join(', ')} WHERE id = ?
      `);

      stmt.run(...values);
    }

    // Update tags if provided
    if (tag_ids !== undefined) {
      db.prepare('DELETE FROM transaction_tags WHERE transaction_id = ?').run(id);

      if (tag_ids.length > 0) {
        const tagStmt = db.prepare(
          'INSERT INTO transaction_tags (transaction_id, tag_id) VALUES (?, ?)'
        );

        const insertTags = db.transaction((tags: number[]) => {
          for (const tagId of tags) {
            tagStmt.run(id, tagId);
          }
        });

        insertTags(tag_ids);
      }
    }

    return this.findById(id);
  }

  static delete(id: number): boolean {
    const result = db.prepare('DELETE FROM transactions WHERE id = ?').run(id);
    return result.changes > 0;
  }

  static getSummary(filters?: {
    currency?: string;
    start_date?: string;
    end_date?: string;
  }) {
    let query = `
      SELECT
        currency,
        transaction_type,
        SUM(amount) as total
      FROM transactions
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filters?.currency) {
      query += ' AND currency = ?';
      params.push(filters.currency);
    }

    if (filters?.start_date) {
      query += ' AND transaction_date >= ?';
      params.push(filters.start_date);
    }

    if (filters?.end_date) {
      query += ' AND transaction_date <= ?';
      params.push(filters.end_date);
    }

    query += ' GROUP BY currency, transaction_type';

    const results = db.prepare(query).all(...params) as any[];

    const summary: any = {};

    results.forEach((row) => {
      if (!summary[row.currency]) {
        summary[row.currency] = { income: 0, expenses: 0, net: 0 };
      }

      if (row.transaction_type === 'income') {
        summary[row.currency].income = row.total;
      } else {
        summary[row.currency].expenses = row.total;
      }
    });

    Object.keys(summary).forEach((currency) => {
      summary[currency].net = summary[currency].income - summary[currency].expenses;
    });

    return summary;
  }

  static getSummaryByCategory(filters?: {
    currency?: string;
    transaction_type?: string;
    start_date?: string;
    end_date?: string;
  }) {
    let query = `
      SELECT
        c.name as category_name,
        c.color as category_color,
        c.icon as category_icon,
        t.currency,
        t.transaction_type,
        SUM(t.amount) as total,
        COUNT(t.id) as count
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filters?.currency) {
      query += ' AND t.currency = ?';
      params.push(filters.currency);
    }

    if (filters?.transaction_type) {
      query += ' AND t.transaction_type = ?';
      params.push(filters.transaction_type);
    }

    if (filters?.start_date) {
      query += ' AND t.transaction_date >= ?';
      params.push(filters.start_date);
    }

    if (filters?.end_date) {
      query += ' AND t.transaction_date <= ?';
      params.push(filters.end_date);
    }

    query += ' GROUP BY c.id, t.currency, t.transaction_type ORDER BY total DESC';

    return db.prepare(query).all(...params);
  }
}
