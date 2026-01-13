import db from '../database';
import { Category } from '../types';

export class CategoryModel {
  static create(data: Omit<Category, 'id' | 'created_at'>): Category {
    const stmt = db.prepare(`
      INSERT INTO categories (name, description, color, icon)
      VALUES (?, ?, ?, ?)
    `);

    const result = stmt.run(
      data.name,
      data.description || null,
      data.color || null,
      data.icon || null
    );

    return this.findById(result.lastInsertRowid as number)!;
  }

  static findById(id: number): Category | undefined {
    return db.prepare('SELECT * FROM categories WHERE id = ?').get(id) as Category | undefined;
  }

  static findAll(): Category[] {
    return db.prepare('SELECT * FROM categories ORDER BY name').all() as Category[];
  }

  static findByName(name: string): Category | undefined {
    return db.prepare('SELECT * FROM categories WHERE name = ?').get(name) as Category | undefined;
  }

  static update(id: number, data: Partial<Omit<Category, 'id' | 'created_at'>>): Category | undefined {
    const fields: string[] = [];
    const values: any[] = [];

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    });

    if (fields.length === 0) {
      return this.findById(id);
    }

    values.push(id);

    const stmt = db.prepare(`
      UPDATE categories SET ${fields.join(', ')} WHERE id = ?
    `);

    stmt.run(...values);
    return this.findById(id);
  }

  static delete(id: number): boolean {
    const result = db.prepare('DELETE FROM categories WHERE id = ?').run(id);
    return result.changes > 0;
  }
}
