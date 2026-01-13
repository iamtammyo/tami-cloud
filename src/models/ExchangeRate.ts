import db from '../database';
import { ExchangeRate } from '../types';

export class ExchangeRateModel {
  static create(data: Omit<ExchangeRate, 'id' | 'created_at'>): ExchangeRate {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO exchange_rates (from_currency, to_currency, rate, date)
      VALUES (?, ?, ?, ?)
    `);

    const result = stmt.run(
      data.from_currency,
      data.to_currency,
      data.rate,
      data.date
    );

    return this.findById(result.lastInsertRowid as number)!;
  }

  static findById(id: number): ExchangeRate | undefined {
    return db.prepare('SELECT * FROM exchange_rates WHERE id = ?').get(id) as ExchangeRate | undefined;
  }

  static findLatest(fromCurrency: string, toCurrency: string): ExchangeRate | undefined {
    return db.prepare(`
      SELECT * FROM exchange_rates
      WHERE from_currency = ? AND to_currency = ?
      ORDER BY date DESC
      LIMIT 1
    `).get(fromCurrency, toCurrency) as ExchangeRate | undefined;
  }

  static findByDate(fromCurrency: string, toCurrency: string, date: string): ExchangeRate | undefined {
    return db.prepare(`
      SELECT * FROM exchange_rates
      WHERE from_currency = ? AND to_currency = ? AND date = ?
    `).get(fromCurrency, toCurrency, date) as ExchangeRate | undefined;
  }

  static convert(amount: number, fromCurrency: string, toCurrency: string): number | null {
    if (fromCurrency === toCurrency) return amount;

    const rate = this.findLatest(fromCurrency, toCurrency);
    if (!rate) return null;

    return amount * rate.rate;
  }
}
