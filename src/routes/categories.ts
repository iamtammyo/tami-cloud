import { Router, Request, Response } from 'express';
import { CategoryModel } from '../models/Category';
import { TransactionModel } from '../models/Transaction';

const router = Router();

// Get all categories
router.get('/', (_req: Request, res: Response) => {
  try {
    const categories = CategoryModel.findAll();
    res.json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Get category by ID
router.get('/:id', (req: Request, res: Response) => {
  try {
    const category = CategoryModel.findById(parseInt(req.params.id));
    if (!category) {
      return res.status(404).json({ success: false, error: 'Category not found' });
    }
    res.json({ success: true, data: category });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Get category details with transactions and spending summary
router.get('/:id/details', (req: Request, res: Response) => {
  try {
    const categoryId = parseInt(req.params.id);
    const category = CategoryModel.findById(categoryId);

    if (!category) {
      return res.status(404).json({ success: false, error: 'Category not found' });
    }

    // Get transactions for this category with optional date filtering
    const filters = {
      category_id: categoryId,
      start_date: req.query.start_date as string | undefined,
      end_date: req.query.end_date as string | undefined,
    };

    const transactions = TransactionModel.findAll(filters);

    // Calculate totals by currency and type
    const totals: any = {};
    transactions.forEach(tx => {
      if (!totals[tx.currency]) {
        totals[tx.currency] = { income: 0, expense: 0, net: 0 };
      }
      if (tx.transaction_type === 'income') {
        totals[tx.currency].income += tx.amount;
      } else {
        totals[tx.currency].expense += tx.amount;
      }
      totals[tx.currency].net = totals[tx.currency].income - totals[tx.currency].expense;
    });

    res.json({
      success: true,
      data: {
        category,
        transactions,
        totals,
        transaction_count: transactions.length,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Create new category
router.post('/', (req: Request, res: Response) => {
  try {
    const { name, description, color, icon } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, error: 'Name is required' });
    }

    const category = CategoryModel.create({ name, description, color, icon });
    res.status(201).json({ success: true, data: category });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Update category
router.put('/:id', (req: Request, res: Response) => {
  try {
    const { name, description, color, icon } = req.body;
    const category = CategoryModel.update(parseInt(req.params.id), {
      name,
      description,
      color,
      icon,
    });

    if (!category) {
      return res.status(404).json({ success: false, error: 'Category not found' });
    }

    res.json({ success: true, data: category });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Delete category
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const success = CategoryModel.delete(parseInt(req.params.id));

    if (!success) {
      return res.status(404).json({ success: false, error: 'Category not found' });
    }

    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

export default router;
