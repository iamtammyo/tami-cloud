import { Router, Request, Response } from 'express';
import { BudgetModel } from '../models/Budget';
import { CreateBudgetInput } from '../types';

const router = Router();

// Get all budgets
router.get('/', (req: Request, res: Response) => {
  try {
    const isActive = req.query.is_active === 'true' ? true : req.query.is_active === 'false' ? false : undefined;
    const budgets = BudgetModel.findAll({ is_active: isActive });
    res.json({ success: true, data: budgets });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Get budget by ID
router.get('/:id', (req: Request, res: Response) => {
  try {
    const budget = BudgetModel.findById(parseInt(req.params.id));
    if (!budget) {
      return res.status(404).json({ success: false, error: 'Budget not found' });
    }
    res.json({ success: true, data: budget });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Get budget progress
router.get('/:id/progress', (req: Request, res: Response) => {
  try {
    const progress = BudgetModel.getProgress(parseInt(req.params.id));
    if (!progress) {
      return res.status(404).json({ success: false, error: 'Budget not found' });
    }
    res.json({ success: true, data: progress });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Create new budget
router.post('/', (req: Request, res: Response) => {
  try {
    const data: CreateBudgetInput = req.body;

    // Validate required fields
    if (!data.name || !data.amount || !data.currency || !data.period || !data.start_date) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, amount, currency, period, start_date',
      });
    }

    const budget = BudgetModel.create(data);
    res.status(201).json({ success: true, data: budget });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Update budget
router.put('/:id', (req: Request, res: Response) => {
  try {
    const budget = BudgetModel.update(parseInt(req.params.id), req.body);

    if (!budget) {
      return res.status(404).json({ success: false, error: 'Budget not found' });
    }

    res.json({ success: true, data: budget });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Delete budget
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const success = BudgetModel.delete(parseInt(req.params.id));

    if (!success) {
      return res.status(404).json({ success: false, error: 'Budget not found' });
    }

    res.json({ success: true, message: 'Budget deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

export default router;
