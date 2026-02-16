# Personal Ledger App

A minimalistic web application for tracking personal cash flow built with Next.js, MongoDB, Tailwind CSS, and shadcn/ui.

## Features

- **Transaction Management**: Log income, expenses, and transfers with repeat functionality
- **Recurring Transactions**: Create repeated transactions (daily, weekly, bi-weekly, monthly, quarterly)
  - Optional amounts for bills where the amount is unknown
  - Edit single occurrence or all future occurrences
- **Financial Dashboard**: View balance, income, expenses, and unpaid transactions
  - Customizable date ranges with persistence
  - Toggle to include/exclude unpaid transactions and savings
- **Running Balance**: Credit card statement-style running balance in transactions table
- **Savings Accounts**: Track savings accounts separately for reference
- **PIN Security**: Optional PIN protection with security question recovery
  - 30-minute inactivity timeout with automatic logout
- **Data Management**: Backup, restore, and manage your financial data
- **Theme Support**: Light/dark mode with persistence across pages
- **Responsive Design**: Works seamlessly on mobile and desktop devices
- **Docker Support**: Easy deployment with Docker Compose

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes
- **Database**: MongoDB 7
- **Deployment**: Docker & Docker Compose

## Quick Start with Docker (Recommended)

The easiest way to run the application on any machine:

1. **Run the startup script**:
   ```bash
   ./start.sh
   ```

2. **Access the application** at [http://localhost:3000](http://localhost:3000)

For detailed Docker deployment instructions, see [DOCKER-DEPLOYMENT.md](DOCKER-DEPLOYMENT.md)

## Manual Setup

### Prerequisites

- Node.js 20+
- MongoDB 7+

### Local Development

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env.local
   ```
   
   Update `.env.local`:
   ```
   MONGODB_URI=mongodb://localhost:27017/ledger
   ENCRYPTION_KEY=your-secure-encryption-key
   ```

3. **Start MongoDB**:
   ```bash
   docker run --name ledger-mongo -p 27017:27017 -d mongo:7
   ```

4. **Run the development server**:
   ```bash
   npm run dev
   ```

5. **Open** [http://localhost:3000](http://localhost:3000)

## Usage

### PIN Security (Optional)

On first launch, you can:
- **Setup a PIN**: Secure your ledger with a 6-digit PIN
- **Skip**: Use the app without authentication

If you set up a PIN:
- You'll need to enter it each time you access the app
- Set a security question for PIN recovery
- Use the logout button to lock the app

### Managing Transactions

1. **Add Transaction**: Click the + button (bottom right)
   - Enter date, type (Income/Expense/Transfer), amount, and company
   - Mark as paid/unpaid
   - Optional: Enable "Repeat" to create recurring transactions
   - For repeated transactions, amount is optional (useful for bills with unknown amounts)

2. **Repeat Transactions**: 
   - Choose frequency (Daily, Weekly, Bi-weekly, Monthly, Quarterly)
   - Set end date (defaults to end of year)
   - Creates multiple transactions with "Repeated" tag
   - Leave amount empty if unknown - update later when bill arrives

3. **Edit/Delete**: Use the actions in the transactions table
   - For repeated transactions, choose to edit single or all future occurrences
   - Running balance shows cumulative balance like a credit card statement

4. **Date Range Filters**: 
   - Select custom date ranges on Dashboard and Transactions pages
   - Date ranges persist when switching between pages

### Dashboard Features

- **Total Balance**: Toggle to include/exclude unpaid transactions and savings
- **Date Range Selection**: Choose from presets or custom range (persists across sessions)
- **Unpaid & Due**: Shows transactions that are unpaid and due today or past due
- **Income vs Expenses**: Visual breakdown with charts
- **Spend by Categories**: Top spending categories

### Repeated Transactions

View all recurring transaction series in Settings:
- Filter by frequency (Daily, Weekly, Bi-weekly, Monthly, Quarterly)
- See start date, end date, and count for each series
- Track recurring bills and income

### Savings Accounts

Track savings accounts in Settings:
- Add account name and balance
- View total savings
- Include in dashboard balance calculation (optional)

### Data Management

In Settings, you can:
- **Backup**: Download all data as JSON
- **Restore**: Import data from backup file
- **Delete All**: Clear all data (requires confirmation)

## Project Structure

```
personal-ledger-app/
├── app/
│   ├── api/              # API routes
│   │   ├── auth/         # PIN authentication
│   │   ├── transactions/ # Transaction CRUD
│   │   ├── savings-accounts/
│   │   ├── backup/       # Data export
│   │   └── restore/      # Data import
│   ├── dashboard/        # Main dashboard
│   ├── transactions/     # Transactions page
│   ├── settings/         # Settings page
│   └── layout.js         # Root layout with auth
├── components/
│   ├── ui/               # shadcn/ui components
│   ├── AuthGuard.js      # Authentication wrapper
│   ├── PinLogin.js       # PIN entry screen
│   ├── PinSetup.js       # PIN setup screen
│   └── ...               # Other components
├── contexts/
│   ├── AuthContext.js    # Authentication state
│   └── LedgerContext.js  # App state management
├── lib/
│   ├── models/           # Database models
│   │   ├── transaction.js
│   │   ├── savingsAccount.js
│   │   └── auth.js       # PIN & security
│   ├── mongodb.js        # MongoDB connection
│   └── transactions.js   # Transaction utilities
├── Dockerfile            # Multi-stage build
├── docker-compose.yml    # Full stack orchestration
└── start.sh              # Quick start script
```

## API Endpoints

### Authentication
- `GET /api/auth/setup` - Check if PIN is set
- `POST /api/auth/setup` - Setup PIN and security question
- `POST /api/auth/verify` - Verify PIN
- `GET /api/auth/reset` - Get security question
- `POST /api/auth/reset` - Reset PIN with security answer

### Transactions
- `GET /api/transactions` - Get all transactions
- `POST /api/transactions` - Create transaction(s)
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction

### Savings Accounts
- `GET /api/savings-accounts` - Get all accounts
- `POST /api/savings-accounts` - Create account
- `PUT /api/savings-accounts/:id` - Update account
- `DELETE /api/savings-accounts/:id` - Delete account

### Data Management
- `GET /api/backup` - Export all data
- `POST /api/restore` - Import data from backup
- `POST /api/cleanup` - Delete all data
- `GET /api/health` - Health check

## Security

- **PIN Protection**: Optional 6-digit PIN with SHA-256 hashing
- **Security Questions**: AES-256 encrypted answers for PIN recovery
- **Environment Variables**: Sensitive keys stored in environment
- **No External Auth**: All data stays local, no third-party services

## Docker Deployment

See [DOCKER-DEPLOYMENT.md](DOCKER-DEPLOYMENT.md) for comprehensive deployment guide including:
- Quick start instructions
- Data backup and restore
- Production deployment tips
- Troubleshooting guide

## License

MIT
