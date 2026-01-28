import db from '../database';
import { Tag } from '../types';

export class TagModel {
  static create(data: Omit<Tag, 'id' | 'created_at'>): Tag {
    const stmt = db.prepare(`
      INSERT INTO tags (name, color)
      VALUES (?, ?)
    `);

    const result = stmt.run(data.name, data.color || null);

    return this.findById(result.lastInsertRowid as number)!;
  }

  static findById(id: number): Tag | undefined {
    return db.prepare('SELECT * FROM tags WHERE id = ?').get(id) as Tag | undefined;
  }

  static findAll(): Tag[] {
    return db.prepare('SELECT * FROM tags ORDER BY name').all() as Tag[];
  }

  static findByName(name: string): Tag | undefined {
    return db.prepare('SELECT * FROM tags WHERE name = ?').get(name) as Tag | undefined;
  }

  static findOrCreate(name: string, color?: string): Tag {
    const existing = this.findByName(name);
    if (existing) return existing;

    return this.create({ name, color });
  }

  static update(id: number, data: Partial<Omit<Tag, 'id' | 'created_at'>>): Tag | undefined {
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
      UPDATE tags SET ${fields.join(', ')} WHERE id = ?
    `);

    stmt.run(...values);
    return this.findById(id);
  }

  static delete(id: number): boolean {
    const result = db.prepare('DELETE FROM tags WHERE id = ?').run(id);
    return result.changes > 0;
  }
}
