# Tami Cloud Budget Tracker - Setup Guide

This guide will walk you through setting up the Tami Cloud Budget Tracker from scratch.

## Step 1: Install Dependencies

```bash
npm install
```

This will install all required packages including:
- Express (web framework)
- TypeScript (type-safe JavaScript)
- SQLite (database)
- Google APIs (Gmail integration)
- And more...

## Step 2: Set Up Environment Variables

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Edit `.env` and configure your settings:

```env
PORT=3000
NODE_ENV=development
DATABASE_PATH=./data/budget.db
```

For now, you can leave the Gmail and Exchange Rate API keys empty. We'll set those up later if needed.

## Step 3: Initialize the Database

Run the migration script to create all necessary tables:

```bash
npm run db:migrate
```

This will:
- Create a `data` directory
- Set up the SQLite database
- Create all tables (transactions, categories, tags, budgets, etc.)
- Insert default categories

You should see: "Database initialized successfully!"

## Step 4: Start the Server

Start the development server:

```bash
npm run dev
```

You should see:
```
🚀 Tami Cloud Budget Tracker API is running!
📡 Server: http://localhost:3000
🏥 Health check: http://localhost:3000/health
```

## Step 5: Test the API

Open your browser or use curl to test the health endpoint:

```bash
curl http://localhost:3000/health
```

You should get:
```json
{
  "status": "ok",
  "message": "Tami Cloud Budget Tracker is running"
}
```

## Step 6: Add Your First Transaction

Let's add a manual transaction:

```bash
curl -X POST http://localhost:3000/api/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 5000,
    "currency": "NGN",
    "description": "Lunch at restaurant",
    "category_id": 1,
    "transaction_date": "2024-01-13",
    "transaction_type": "expense"
  }'
```

You should get a response with your created transaction!

## Step 7: View Your Transactions

Get all transactions:

```bash
curl http://localhost:3000/api/transactions
```

## Step 8: (Optional) Set Up Gmail Integration

If you want to automatically pull transactions from Gmail:

### 8.1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (e.g., "Budget Tracker")
3. Enable the Gmail API:
   - Go to "APIs & Services" > "Library"
   - Search for "Gmail API"
   - Click "Enable"

### 8.2: Create OAuth Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Configure OAuth consent screen if prompted:
   - User Type: External (for testing)
   - Fill in required fields
4. Choose application type: "Desktop app" or "Web application"
5. Add authorized redirect URIs:
   - `http://localhost:3000/auth/google/callback`
6. Click "Create"
7. Download the JSON file

### 8.3: Configure Gmail Credentials

1. Rename the downloaded file to `credentials.json`
2. Move it to the project root directory:
```bash
mv ~/Downloads/client_secret_*.json ./credentials.json
```

3. Update your `.env` file:
```env
GMAIL_CLIENT_ID=your_client_id_from_credentials
GMAIL_CLIENT_SECRET=your_client_secret_from_credentials
GMAIL_REDIRECT_URI=http://localhost:3000/auth/google/callback
```

### 8.4: Authenticate with Gmail

1. Get the authorization URL:
```bash
curl http://localhost:3000/api/gmail/auth/init
```

2. Copy the `auth_url` from the response and open it in your browser

3. Log in with your Google account and grant permissions

4. You'll be redirected back with a code - the app will handle it automatically

5. Check authentication status:
```bash
curl http://localhost:3000/api/gmail/auth/status
```

### 8.5: Sync Transactions from Gmail

Now you can sync transactions from your email:

```bash
curl -X POST http://localhost:3000/api/gmail/sync \
  -H "Content-Type: application/json" \
  -d '{"max_emails": 50}'
```

The system will:
- Search for transaction-related emails
- Extract amount, currency, and description
- Automatically categorize transactions
- Skip duplicates

## Step 9: (Optional) Set Up Exchange Rates

To enable automatic currency conversion:

### 9.1: Get API Key

Sign up for a free API key from one of these services:
- [ExchangeRate-API](https://exchangerate-api.com) (recommended, free tier: 1,500 requests/month)
- [Fixer.io](https://fixer.io)
- [CurrencyAPI](https://currencyapi.com)

### 9.2: Add to Environment

Add your API key to `.env`:
```env
EXCHANGE_RATE_API_KEY=your_api_key_here
```

### 9.3: Update Rates

Fetch the latest exchange rates:
```bash
curl -X POST http://localhost:3000/api/exchange-rates/update
```

### 9.4: Convert Currency

Test currency conversion:
```bash
curl -X POST http://localhost:3000/api/exchange-rates/convert \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 100,
    "from": "USD",
    "to": "NGN"
  }'
```

## Step 10: Set Up Budgets

Create a monthly budget:

```bash
curl -X POST http://localhost:3000/api/budgets \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Monthly Food Budget",
    "amount": 50000,
    "currency": "NGN",
    "period": "monthly",
    "category_id": 1,
    "start_date": "2024-01-01",
    "end_date": "2024-01-31"
  }'
```

Check budget progress:
```bash
curl http://localhost:3000/api/budgets/1/progress
```

## Common Issues

### Port Already in Use

If port 3000 is already in use, change it in `.env`:
```env
PORT=3001
```

### Database Not Found

Make sure you ran the migration:
```bash
npm run db:migrate
```

### Gmail Authentication Failed

1. Check that `credentials.json` is in the project root
2. Verify the redirect URI matches exactly in Google Cloud Console
3. Make sure the Gmail API is enabled

### Exchange Rate API Not Working

1. Verify your API key is correct
2. Check you haven't exceeded the free tier limit
3. Try using a different provider

## Next Steps

Now that everything is set up, you can:

1. **Build a Frontend**: Create a web or mobile app that consumes this API
2. **Customize Categories**: Add/modify categories to match your spending habits
3. **Set Up Automated Sync**: Use cron jobs to sync Gmail periodically
4. **Add More Banks**: Extend the Gmail parser to handle more bank formats
5. **Export Data**: Build export functionality for reports

## Getting Help

- Check the main [README.md](./README.md) for API documentation
- Review the code in `src/` for implementation details
- Open an issue on GitHub for bugs or questions

Happy tracking!
