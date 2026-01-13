import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeDatabase } from './database';

// Import routes
import transactionsRouter from './routes/transactions';
import categoriesRouter from './routes/categories';
import tagsRouter from './routes/tags';
import budgetsRouter from './routes/budgets';
import exchangeRatesRouter from './routes/exchangeRates';
import gmailRouter from './routes/gmail';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize database
initializeDatabase();

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', message: 'Tami Cloud Budget Tracker is running' });
});

// API routes
app.use('/api/transactions', transactionsRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/tags', tagsRouter);
app.use('/api/budgets', budgetsRouter);
app.use('/api/exchange-rates', exchangeRatesRouter);
app.use('/api/gmail', gmailRouter);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Endpoint not found' });
});

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ success: false, error: err.message || 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Tami Cloud Budget Tracker API is running!`);
  console.log(`📡 Server: http://localhost:${PORT}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  console.log(`\n📚 Available endpoints:`);
  console.log(`  Transactions:`);
  console.log(`    - GET    /api/transactions`);
  console.log(`    - POST   /api/transactions`);
  console.log(`    - GET    /api/transactions/:id`);
  console.log(`    - PUT    /api/transactions/:id`);
  console.log(`    - DELETE /api/transactions/:id`);
  console.log(`    - GET    /api/transactions/summary/overview`);
  console.log(`    - GET    /api/transactions/summary/by-category`);
  console.log(`  Categories & Tags:`);
  console.log(`    - GET    /api/categories`);
  console.log(`    - GET    /api/tags`);
  console.log(`  Budgets:`);
  console.log(`    - GET    /api/budgets`);
  console.log(`    - GET    /api/budgets/:id/progress`);
  console.log(`  Exchange Rates:`);
  console.log(`    - GET    /api/exchange-rates/latest`);
  console.log(`    - POST   /api/exchange-rates/convert`);
  console.log(`  Gmail Integration:`);
  console.log(`    - GET    /api/gmail/auth/init`);
  console.log(`    - GET    /api/gmail/auth/status`);
  console.log(`    - POST   /api/gmail/sync\n`);
});

export default app;
