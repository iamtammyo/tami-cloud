# Tami Cloud Budget Tracker

A multi-currency budget tracking application that automatically pulls transaction data from Gmail and supports manual entry. Track your spending in both Nigerian Naira (NGN) and US Dollars (USD) with categories, tags, and budget goals.

## Features

- **Web Interface**: Clean, modern web UI for easy interaction with your budget data
- **Multi-Currency Support**: Track expenses in both NGN and USD with automatic currency conversion
- **Gmail Integration**: Automatically extract transaction data from bank notification emails
- **Manual Entry**: Add transactions manually with detailed categorization
- **Categories & Tags**: Organize transactions with customizable categories and tags
- **Budget Tracking**: Set budgets and monitor spending against goals
- **Spending Reports**: Generate summaries by category, time period, and currency
- **RESTful API**: Complete REST API for integration with other applications

## Technology Stack

- **Frontend**: HTML, CSS, JavaScript (Vanilla JS)
- **Backend**: Node.js with TypeScript and Express
- **Database**: SQLite (easily upgradeable to PostgreSQL)
- **Gmail Integration**: Google Gmail API
- **Currency Conversion**: Support for exchange rate APIs

## Quick Start

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Google Cloud Console account (for Gmail integration)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd tami-cloud
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Initialize the database:
```bash
npm run db:migrate
```

5. Start the development server:
```bash
npm run dev
```

The application will be available at:
- **Web Interface**: http://localhost:3000
- **API**: http://localhost:3000/api

## Configuration

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database
DATABASE_PATH=./data/budget.db

# Gmail API Configuration (optional)
GMAIL_CLIENT_ID=your_client_id_here
GMAIL_CLIENT_SECRET=your_client_secret_here
GMAIL_REDIRECT_URI=http://localhost:3000/auth/google/callback

# Currency Conversion API (optional)
EXCHANGE_RATE_API_KEY=your_api_key_here
```

### Gmail Integration Setup

To enable Gmail integration for automatic transaction extraction:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Gmail API
4. Create OAuth 2.0 credentials:
   - Application type: Desktop app or Web application
   - Add authorized redirect URIs: `http://localhost:3000/auth/google/callback`
5. Download the credentials and save as `credentials.json` in the project root
6. Run the app and visit `/api/gmail/auth/init` to get the authorization URL
7. Complete the OAuth flow to grant access

For detailed setup instructions, see [SETUP_GUIDE.md](./SETUP_GUIDE.md).

## API Documentation

### Transactions

#### Get All Transactions
```http
GET /api/transactions
Query Parameters:
  - currency: Filter by currency (NGN or USD)
  - transaction_type: Filter by type (income or expense)
  - category_id: Filter by category ID
  - start_date: Start date (YYYY-MM-DD)
  - end_date: End date (YYYY-MM-DD)
  - limit: Number of results (default: 100)
  - offset: Pagination offset (default: 0)
```

#### Create Transaction
```http
POST /api/transactions
Body:
{
  "amount": 5000,
  "currency": "NGN",
  "description": "Lunch at restaurant",
  "category_id": 1,
  "transaction_date": "2024-01-13",
  "transaction_type": "expense",
  "notes": "Optional notes",
  "tag_ids": [1, 2]
}
```

For complete API documentation, see the full API reference in the [API Documentation](#api-documentation) section below.

## Default Categories

The system comes with pre-configured categories:

- Food & Dining 🍔
- Transportation 🚗
- Shopping 🛍️
- Bills & Utilities 💡
- Entertainment 🎮
- Healthcare 🏥
- Education 📚
- Salary 💰
- Business 💼
- Other 📌

## Project Structure

```
tami-cloud/
├── src/
│   ├── database/          # Database setup and migrations
│   ├── models/            # Data models
│   ├── routes/            # API routes
│   ├── services/          # Business logic
│   ├── types/             # TypeScript types
│   └── index.ts           # Application entry point
├── data/                  # Database files (created at runtime)
├── .env                   # Environment variables
├── package.json
├── tsconfig.json
├── README.md
└── SETUP_GUIDE.md
```

## Future Enhancements

Potential features for future development:

- **Banking API Integration**: Direct connection to Nigerian banks
- **Recurring Transactions**: Support for recurring income and expenses
- **Export Functionality**: Export data to CSV, Excel, or PDF
- **Data Visualization**: Charts and graphs for spending trends
- **Mobile App**: React Native or Flutter mobile application
- **Receipt Scanning**: OCR for extracting data from receipt images
- **Multi-User Support**: User authentication and multi-tenant support

## License

MIT License
