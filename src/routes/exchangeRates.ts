import { Router, Request, Response } from 'express';
import { ExchangeRateService } from '../services/exchangeRate';
import { ExchangeRateModel } from '../models/ExchangeRate';

const router = Router();

// Get latest exchange rate
router.get('/latest', (req: Request, res: Response) => {
  try {
    const { from, to } = req.query;

    if (!from || !to) {
      return res.status(400).json({
        success: false,
        error: 'Query parameters "from" and "to" are required',
      });
    }

    const rate = ExchangeRateService.getLatestRate(from as string, to as string);

    if (!rate) {
      return res.status(404).json({
        success: false,
        error: `No exchange rate found for ${from} to ${to}`,
      });
    }

    res.json({ success: true, data: rate });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Convert amount between currencies
router.post('/convert', (req: Request, res: Response) => {
  try {
    const { amount, from, to } = req.body;

    if (!amount || !from || !to) {
      return res.status(400).json({
        success: false,
        error: 'Fields "amount", "from", and "to" are required',
      });
    }

    const converted = ExchangeRateService.convert(parseFloat(amount), from, to);

    if (converted === null) {
      return res.status(404).json({
        success: false,
        error: `No exchange rate found for ${from} to ${to}`,
      });
    }

    const rate = ExchangeRateModel.findLatest(from, to);

    res.json({
      success: true,
      data: {
        original_amount: parseFloat(amount),
        original_currency: from,
        converted_amount: converted,
        converted_currency: to,
        rate: rate?.rate,
        rate_date: rate?.date,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Manually update exchange rates
router.post('/update', async (_req: Request, res: Response) => {
  try {
    await ExchangeRateService.fetchLatestRates();
    res.json({
      success: true,
      message: 'Exchange rates updated successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

export default router;
