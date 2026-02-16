const TRANSACTION_TYPES = ['Income', 'Expense', 'Transfer'];

/**
 * Parse a date string (YYYY-MM-DD) as a local date, not UTC
 * This prevents timezone conversion issues
 */
function parseLocalDate(dateString) {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day, 12, 0, 0);
}

export function validateTransaction(transaction) {
  const errors = [];
  
  if (!transaction.date) {
    errors.push('Date is required');
  }
  
  if (!transaction.type) {
    errors.push('Transaction type is required');
  } else if (!TRANSACTION_TYPES.includes(transaction.type)) {
    errors.push(`Transaction type must be one of: ${TRANSACTION_TYPES.join(', ')}`);
  }
  
  if (transaction.amount === undefined || transaction.amount === null) {
    errors.push('Amount is required');
  } else if (typeof transaction.amount !== 'number') {
    errors.push('Amount must be a number');
  } else if (transaction.amount === 0 && !transaction.repeat) {
    // Allow zero amount only for repeated transactions (where amount is unknown)
    errors.push('Amount must be a non-zero number');
  }
  
  if (!transaction.company || transaction.company.trim() === '') {
    errors.push('Company is required');
  }
  
  if (transaction.paid === undefined || transaction.paid === null) {
    errors.push('Paid status is required');
  } else if (typeof transaction.paid !== 'boolean') {
    errors.push('Paid status must be a boolean');
  }
  
  // Validate amount sign based on type (skip if amount is 0 for repeated transactions)
  if (transaction.amount !== 0) {
    if (transaction.type === 'Income' && transaction.amount < 0) {
      errors.push('Income amount must be positive');
    }
    
    if ((transaction.type === 'Expense' || transaction.type === 'Transfer') && transaction.amount > 0) {
      errors.push('Expense and Transfer amounts must be negative');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

export function normalizeTransactionAmount(transaction) {
  const normalized = { ...transaction };
  
  if (transaction.type === 'Income') {
    normalized.amount = Math.abs(transaction.amount);
  } else if (transaction.type === 'Expense' || transaction.type === 'Transfer') {
    normalized.amount = -Math.abs(transaction.amount);
  }
  
  return normalized;
}

export function calculateBalance(transactions) {
  return transactions.reduce((sum, t) => sum + t.amount, 0);
}

export function calculateTotalIncome(transactions) {
  return transactions
    .filter(t => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);
}

export function calculateTotalExpenses(transactions) {
  return transactions
    .filter(t => t.amount < 0)
    .reduce((sum, t) => sum + t.amount, 0);
}

export function sortTransactionsByDate(transactions) {
  return [...transactions].sort((a, b) => {
    return parseLocalDate(b.date) - parseLocalDate(a.date);
  });
}

export function filterPendingTransactions(transactions) {
  return transactions.filter(t => t.isPending === true);
}

export function formatCurrency(amount) {
  const sign = amount >= 0 ? '+' : '-';
  return `${sign}$${Math.abs(amount).toFixed(2)}`;
}

export function formatDate(dateString) {
  // Parse date string as local date (not UTC)
  const date = parseLocalDate(dateString);
  
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

// Export the helper for use in other files
export { parseLocalDate };
