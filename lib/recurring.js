const TRANSACTION_TYPES = ['Income', 'Expense', 'Transfer'];
const FREQUENCIES = ['monthly', 'biweekly', 'custom'];
const AMOUNT_TYPES = ['fixed', 'variable'];

export function validateRecurringTemplate(template) {
  const errors = [];
  
  if (!template.type) {
    errors.push('Transaction type is required');
  } else if (!TRANSACTION_TYPES.includes(template.type)) {
    errors.push(`Transaction type must be one of: ${TRANSACTION_TYPES.join(', ')}`);
  }
  
  if (!template.company || template.company.trim() === '') {
    errors.push('Company is required');
  }
  
  if (!template.amountType) {
    errors.push('Amount type is required');
  } else if (!AMOUNT_TYPES.includes(template.amountType)) {
    errors.push(`Amount type must be one of: ${AMOUNT_TYPES.join(', ')}`);
  }
  
  if (template.amountType === 'fixed') {
    if (template.amount === undefined || template.amount === null) {
      errors.push('Amount is required for fixed amount type');
    } else if (typeof template.amount !== 'number' || template.amount === 0) {
      errors.push('Amount must be a non-zero number');
    }
  }
  
  if (!template.startDate) {
    errors.push('Start date is required');
  }
  
  if (!template.recurrencePattern) {
    errors.push('Recurrence pattern is required');
  } else {
    const pattern = template.recurrencePattern;
    
    if (!pattern.frequency) {
      errors.push('Recurrence frequency is required');
    } else if (!FREQUENCIES.includes(pattern.frequency)) {
      errors.push(`Frequency must be one of: ${FREQUENCIES.join(', ')}`);
    }
    
    if (pattern.frequency === 'custom') {
      if (!pattern.interval || pattern.interval < 1) {
        errors.push('Interval must be at least 1 day for custom frequency');
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

export function shouldGenerateTransaction(template, currentDate) {
  if (!template.isActive) return false;
  
  const today = new Date(currentDate);
  const startDate = new Date(template.startDate);
  
  // Don't generate if before start date
  if (today < startDate) return false;
  
  return true; // Let processAllTemplates handle the logic
}

export function getAllDueTransactionDates(template, currentDate) {
  const pattern = template.recurrencePattern;
  
  // Parse dates in local timezone to avoid timezone issues
  const today = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
  const startDate = new Date(template.startDate + 'T00:00:00');
  
  // Don't generate if before start date
  if (today < startDate) return [];
  
  // Determine the last generated date
  const lastGenerated = template.lastGenerated ? new Date(template.lastGenerated + 'T00:00:00') : null;
  
  const dueDates = [];
  
  if (pattern.frequency === 'monthly') {
    // Generate for each month from start date (or last generated + 1 month) to today
    const targetDay = startDate.getDate();
    let checkDate = lastGenerated ? new Date(lastGenerated) : new Date(startDate);
    
    // If we have a lastGenerated, start from the next month
    if (lastGenerated) {
      checkDate = new Date(checkDate.getFullYear(), checkDate.getMonth() + 1, targetDay);
    }
    
    while (checkDate <= today) {
      // Handle months with fewer days (e.g., Feb 31 -> Feb 28)
      const year = checkDate.getFullYear();
      const month = checkDate.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const actualDay = Math.min(targetDay, daysInMonth);
      
      const actualDate = new Date(year, month, actualDay);
      
      if (actualDate >= startDate && actualDate <= today) {
        dueDates.push(actualDate);
      }
      
      // Move to next month
      checkDate = new Date(year, month + 1, targetDay);
    }
  } else if (pattern.frequency === 'biweekly') {
    // Generate every 14 days from start date
    let checkDate = lastGenerated ? new Date(lastGenerated) : new Date(startDate);
    
    // If we have a lastGenerated, start from 14 days after
    if (lastGenerated) {
      checkDate = new Date(checkDate.getTime() + 14 * 24 * 60 * 60 * 1000);
    }
    
    while (checkDate <= today) {
      if (checkDate >= startDate) {
        dueDates.push(new Date(checkDate));
      }
      checkDate = new Date(checkDate.getTime() + 14 * 24 * 60 * 60 * 1000);
    }
  } else if (pattern.frequency === 'custom') {
    // Generate every X days from start date
    const interval = pattern.interval || 30;
    let checkDate = lastGenerated ? new Date(lastGenerated) : new Date(startDate);
    
    // If we have a lastGenerated, start from interval days after
    if (lastGenerated) {
      checkDate = new Date(checkDate.getTime() + interval * 24 * 60 * 60 * 1000);
    }
    
    while (checkDate <= today) {
      if (checkDate >= startDate) {
        dueDates.push(new Date(checkDate));
      }
      checkDate = new Date(checkDate.getTime() + interval * 24 * 60 * 60 * 1000);
    }
  }
  
  return dueDates;
}

export function generateTransactionFromTemplate(template, date) {
  // Format date as YYYY-MM-DD in local timezone
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const dateString = `${year}-${month}-${day}`;
  
  const transaction = {
    date: dateString,
    type: template.type,
    company: template.company,
    paid: template.paid,
    isAutoGenerated: true,
    templateId: template.id,
    tags: template.tags || []
  };
  
  if (template.amountType === 'fixed') {
    // Apply correct sign based on transaction type
    if (template.type === 'Income') {
      transaction.amount = Math.abs(template.amount);
    } else if (template.type === 'Expense' || template.type === 'Transfer') {
      transaction.amount = -Math.abs(template.amount);
    }
    transaction.isPending = false;
  } else {
    transaction.amount = 0;
    transaction.isPending = true;
  }
  
  return transaction;
}

export function getNextOccurrence(template, fromDate) {
  const pattern = template.recurrencePattern;
  const date = new Date(fromDate);
  
  if (pattern.frequency === 'monthly') {
    date.setMonth(date.getMonth() + 1);
    date.setDate(pattern.dayOfMonth);
    return date;
  }
  
  if (pattern.frequency === 'weekly') {
    const daysUntilNext = (pattern.dayOfWeek - date.getDay() + 7) % 7 || 7;
    date.setDate(date.getDate() + daysUntilNext);
    return date;
  }
  
  if (pattern.frequency === 'custom') {
    const currentDay = date.getDate();
    const nextDay = pattern.customDates.find(d => d > currentDay);
    
    if (nextDay) {
      date.setDate(nextDay);
    } else {
      date.setMonth(date.getMonth() + 1);
      date.setDate(pattern.customDates[0]);
    }
    return date;
  }
  
  return null;
}

export function processAllTemplates(templates, currentDate) {
  const newTransactions = [];
  
  for (const template of templates) {
    if (shouldGenerateTransaction(template, currentDate)) {
      const dueDates = getAllDueTransactionDates(template, currentDate);
      
      for (const dueDate of dueDates) {
        const transaction = generateTransactionFromTemplate(template, dueDate);
        newTransactions.push(transaction);
      }
    }
  }
  
  return newTransactions;
}

export function formatRecurrencePattern(pattern) {
  if (pattern.frequency === 'monthly') {
    return `Monthly`;
  }
  
  if (pattern.frequency === 'biweekly') {
    return `Every 2 weeks`;
  }
  
  if (pattern.frequency === 'custom') {
    return `Every ${pattern.interval || 30} days`;
  }
  
  return 'Unknown pattern';
}
