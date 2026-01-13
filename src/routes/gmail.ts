import { Router, Request, Response } from 'express';
import { gmailService } from '../services/gmail';

const router = Router();

// Initialize Gmail service
router.get('/auth/init', async (_req: Request, res: Response) => {
  try {
    await gmailService.initialize();
    const authUrl = gmailService.getAuthUrl();

    res.json({
      success: true,
      data: {
        auth_url: authUrl,
        message: 'Visit this URL to authorize access to Gmail',
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Handle OAuth callback
router.get('/auth/callback', async (req: Request, res: Response) => {
  try {
    const { code } = req.query;

    if (!code) {
      return res.status(400).json({ success: false, error: 'Authorization code is required' });
    }

    await gmailService.initialize();
    await gmailService.getToken(code as string);

    res.json({
      success: true,
      message: 'Successfully authenticated with Gmail',
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Check authentication status
router.get('/auth/status', async (_req: Request, res: Response) => {
  try {
    await gmailService.initialize();
    const isAuthenticated = gmailService.isAuthenticated();

    res.json({
      success: true,
      data: { authenticated: isAuthenticated },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Sync transactions from Gmail
router.post('/sync', async (req: Request, res: Response) => {
  try {
    await gmailService.initialize();

    if (!gmailService.isAuthenticated()) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated with Gmail. Please visit /api/gmail/auth/init first.',
      });
    }

    const maxEmails = req.body.max_emails || 50;
    const stats = await gmailService.syncTransactions(maxEmails);

    res.json({
      success: true,
      data: {
        ...stats,
        message: `Imported ${stats.imported} transactions, skipped ${stats.skipped}, errors: ${stats.errors}`,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

export default router;
