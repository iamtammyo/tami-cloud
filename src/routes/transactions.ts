import { Router, Request, Response } from 'express';
import { TransactionModel } from '../models/Transaction';
import { CreateTransactionInput, UpdateTransactionInput } from '../types';

const router = Router();

// Get all transactions with optional filters
router.get('/', (req: Request, res: Response) => {
  try {
    const filters = {
      currency: req.query.currency as string | undefined,
      transaction_type: req.query.transaction_type as string | undefined,
      category_id: req.query.category_id ? parseInt(req.query.category_id as string) : undefined,
      start_date: req.query.start_date as string | undefined,
      end_date: req.query.end_date as string | undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 100,
      offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
    };

    const transactions = TransactionModel.findAll(filters);
    res.json({ success: true, data: transactions });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Get transaction by ID
router.get('/:id', (req: Request, res: Response) => {
  try {
    const transaction = TransactionModel.findById(parseInt(req.params.id));
    if (!transaction) {
      return res.status(404).json({ success: false, error: 'Transaction not found' });
    }
    res.json({ success: true, data: transaction });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Create new transaction
router.post('/', (req: Request, res: Response) => {
  try {
    const data: CreateTransactionInput = req.body;

    // Validate required fields
    if (!data.amount || !data.currency || !data.description || !data.transaction_date || !data.transaction_type) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: amount, currency, description, transaction_date, transaction_type',
      });
    }

    const transaction = TransactionModel.create(data);
    res.status(201).json({ success: true, data: transaction });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Update transaction
router.put('/:id', (req: Request, res: Response) => {
  try {
    const data: UpdateTransactionInput = req.body;
    const transaction = TransactionModel.update(parseInt(req.params.id), data);

    if (!transaction) {
      return res.status(404).json({ success: false, error: 'Transaction not found' });
    }

    res.json({ success: true, data: transaction });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Delete transaction
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const success = TransactionModel.delete(parseInt(req.params.id));

    if (!success) {
      return res.status(404).json({ success: false, error: 'Transaction not found' });
    }

    res.json({ success: true, message: 'Transaction deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Get spending summary
router.get('/summary/overview', (req: Request, res: Response) => {
  try {
    const filters = {
      currency: req.query.currency as string | undefined,
      start_date: req.query.start_date as string | undefined,
      end_date: req.query.end_date as string | undefined,
    };

    const summary = TransactionModel.getSummary(filters);
    res.json({ success: true, data: summary });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Get spending by category
router.get('/summary/by-category', (req: Request, res: Response) => {
  try {
    const filters = {
      currency: req.query.currency as string | undefined,
      transaction_type: req.query.transaction_type as string | undefined,
      start_date: req.query.start_date as string | undefined,
      end_date: req.query.end_date as string | undefined,
    };

    const summary = TransactionModel.getSummaryByCategory(filters);
    res.json({ success: true, data: summary });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

export default router;
