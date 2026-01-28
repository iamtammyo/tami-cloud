import { Router, Request, Response } from 'express';
import { TagModel } from '../models/Tag';

const router = Router();

// Get all tags
router.get('/', (_req: Request, res: Response) => {
  try {
    const tags = TagModel.findAll();
    res.json({ success: true, data: tags });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Get tag by ID
router.get('/:id', (req: Request, res: Response) => {
  try {
    const tag = TagModel.findById(parseInt(req.params.id));
    if (!tag) {
      return res.status(404).json({ success: false, error: 'Tag not found' });
    }
    res.json({ success: true, data: tag });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Create new tag
router.post('/', (req: Request, res: Response) => {
  try {
    const { name, color } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, error: 'Name is required' });
    }

    const tag = TagModel.create({ name, color });
    res.status(201).json({ success: true, data: tag });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Update tag
router.put('/:id', (req: Request, res: Response) => {
  try {
    const { name, color } = req.body;
    const tag = TagModel.update(parseInt(req.params.id), { name, color });

    if (!tag) {
      return res.status(404).json({ success: false, error: 'Tag not found' });
    }

    res.json({ success: true, data: tag });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Delete tag
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const success = TagModel.delete(parseInt(req.params.id));

    if (!success) {
      return res.status(404).json({ success: false, error: 'Tag not found' });
    }

    res.json({ success: true, message: 'Tag deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

export default router;
