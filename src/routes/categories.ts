import { Router, Request, Response } from 'express';
import { CategoryModel } from '../models/Category';

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
