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
      return res.status(400).send(`
        <html>
          <head><title>Authentication Failed</title></head>
          <body style="font-family: Arial; text-align: center; padding: 50px;">
            <h1 style="color: #dc3545;">❌ Authentication Failed</h1>
            <p>No authorization code was provided.</p>
            <a href="/" style="color: #667eea; text-decoration: none;">← Go back to app</a>
          </body>
        </html>
      `);
    }

    await gmailService.initialize();
    await gmailService.getToken(code as string);

    res.send(`
      <html>
        <head>
          <title>Gmail Connected!</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              display: flex;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
            }
            .container {
              background: white;
              padding: 50px;
              border-radius: 16px;
              box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
              text-align: center;
              max-width: 500px;
            }
            h1 { color: #28a745; margin-bottom: 20px; }
            p { color: #6c757d; font-size: 1.1em; line-height: 1.6; }
            .btn {
              display: inline-block;
              margin-top: 30px;
              padding: 12px 30px;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              text-decoration: none;
              border-radius: 8px;
              font-weight: 600;
              transition: transform 0.3s;
            }
            .btn:hover { transform: translateY(-2px); }
            .next-steps {
              margin-top: 30px;
              padding: 20px;
              background: #f8f9fa;
              border-radius: 8px;
              text-align: left;
            }
            .next-steps h3 { color: #333; margin-top: 0; }
            .next-steps ol { color: #495057; }
            .next-steps li { margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>✅ Successfully Connected to Gmail!</h1>
            <p>Your Gmail account has been successfully linked to Tami Cloud Budget Tracker.</p>

            <div class="next-steps">
              <h3>🎯 Next Steps:</h3>
              <ol>
                <li>Go back to the app dashboard</li>
                <li>Sync your transactions from Gmail</li>
                <li>Start tracking your spending!</li>
              </ol>
            </div>

            <a href="/" class="btn">Go to Dashboard</a>
          </div>
        </body>
      </html>
    `);
  } catch (error) {
    res.status(500).send(`
      <html>
        <head><title>Authentication Error</title></head>
        <body style="font-family: Arial; text-align: center; padding: 50px;">
          <h1 style="color: #dc3545;">❌ Authentication Error</h1>
          <p style="color: #6c757d;">${(error as Error).message}</p>
          <a href="/" style="color: #667eea; text-decoration: none;">← Go back to app</a>
        </body>
      </html>
    `);
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
