import Database from 'better-sqlite3';
import * as fs from 'fs';
import * as path from 'path';

const dbPath = process.env.DATABASE_PATH || './data/budget.db';
const dbDir = path.dirname(dbPath);

// Ensure data directory exists
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Initialize database
export const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize schema
export function initializeDatabase() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf-8');

  db.exec(schema);
  console.log('Database initialized successfully');
}

// Helper function to run migrations
export function runMigrations() {
  initializeDatabase();
}

// Graceful shutdown
process.on('exit', () => {
  db.close();
});

process.on('SIGINT', () => {
  db.close();
  process.exit(0);
});

export default db;
