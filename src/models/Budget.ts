import db from '../database';
import { Budget, CreateBudgetInput } from '../types';

export class BudgetModel {
  static create(data: CreateBudgetInput): Budget {
    const stmt = db.prepare(`
      INSERT INTO budgets (
        name, amount, currency, period, category_id, start_date, end_date, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 1)
    `);

    const result = stmt.run(
      data.name,
      data.amount,
      data.currency,
      data.period,
      data.category_id || null,
      data.start_date,
      data.end_date || null
    );

    return this.findById(result.lastInsertRowid as number)!;
  }

  static findById(id: number): Budget | undefined {
    const budget = db.prepare(`
      SELECT b.*, c.name as category_name, c.color as category_color, c.icon as category_icon
      FROM budgets b
      LEFT JOIN categories c ON b.category_id = c.id
      WHERE b.id = ?
    `).get(id) as any;

    if (!budget) return undefined;

    return {
      ...budget,
      is_active: budget.is_active === 1,
      category: budget.category_id ? {
        id: budget.category_id,
        name: budget.category_name,
        color: budget.category_color,
        icon: budget.category_icon,
      } : undefined,
    };
  }

  static findAll(filters?: { is_active?: boolean }): Budget[] {
    let query = `
      SELECT b.*, c.name as category_name, c.color as category_color, c.icon as category_icon
      FROM budgets b
      LEFT JOIN categories c ON b.category_id = c.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filters?.is_active !== undefined) {
      query += ' AND b.is_active = ?';
      params.push(filters.is_active ? 1 : 0);
    }

    query += ' ORDER BY b.created_at DESC';

    const budgets = db.prepare(query).all(...params) as any[];

    return budgets.map(b => ({
      ...b,
      is_active: b.is_active === 1,
      category: b.category_id ? {
        id: b.category_id,
        name: b.category_name,
        color: b.category_color,
        icon: b.category_icon,
      } : undefined,
    }));
  }

  static update(id: number, data: Partial<CreateBudgetInput> & { is_active?: boolean }): Budget | undefined {
    const fields: string[] = [];
    const values: any[] = [];

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        fields.push(`${key} = ?`);
        values.push(key === 'is_active' ? (value ? 1 : 0) : value);
      }
    });

    if (fields.length === 0) {
      return this.findById(id);
    }

    values.push(id);

    const stmt = db.prepare(`
      UPDATE budgets SET ${fields.join(', ')} WHERE id = ?
    `);

    stmt.run(...values);
    return this.findById(id);
  }

  static delete(id: number): boolean {
    const result = db.prepare('DELETE FROM budgets WHERE id = ?').run(id);
    return result.changes > 0;
  }

  static getProgress(budgetId: number) {
    const budget = this.findById(budgetId);
    if (!budget) return null;

    let query = `
      SELECT SUM(amount) as spent
      FROM transactions
      WHERE transaction_type = 'expense'
        AND currency = ?
        AND transaction_date >= ?
    `;
    const params: any[] = [budget.currency, budget.start_date];

    if (budget.end_date) {
      query += ' AND transaction_date <= ?';
      params.push(budget.end_date);
    }

    if (budget.category_id) {
      query += ' AND category_id = ?';
      params.push(budget.category_id);
    }

    const result = db.prepare(query).get(...params) as any;
    const spent = result.spent || 0;

    return {
      budget,
      spent,
      remaining: budget.amount - spent,
      percentage: (spent / budget.amount) * 100,
    };
  }
}
