import { NextResponse } from 'next/server';
import { getTransactions, createTransaction } from '@/lib/models/transaction';
import { validateTransaction, normalizeTransactionAmount } from '@/lib/transactions';

export async function GET() {
  try {
    const transactions = await getTransactions();
    
    return NextResponse.json({
      success: true,
      data: transactions
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    
    // Check if this is a repeating transaction
    if (body.repeat && body.repeatFrequency && body.repeatUntil) {
      // Generate multiple transactions
      const transactions = [];
      const startDate = new Date(body.date);
      const endDate = new Date(body.repeatUntil);
      let currentDate = new Date(startDate);
      
      while (currentDate <= endDate) {
        const transactionData = {
          ...body,
          date: currentDate.toISOString().split('T')[0],
          tags: [...(body.tags || []), 'Repeated'],
          repeat: true // Keep repeat flag for validation
        };
        
        // Normalize amount based on transaction type
        const normalized = normalizeTransactionAmount(transactionData);
        
        // Validate transaction (with repeat flag)
        const validation = validateTransaction(normalized);
        if (!validation.valid) {
          return NextResponse.json({
            success: false,
            error: 'Validation failed',
            errors: validation.errors
          }, { status: 400 });
        }
        
        // Remove repeat fields before saving to database
        delete normalized.repeat;
        delete normalized.repeatFrequency;
        delete normalized.repeatUntil;
        
        // Create transaction
        const transaction = await createTransaction(normalized);
        transactions.push(transaction);
        
        // Calculate next date based on frequency
        const nextDate = new Date(currentDate);
        switch (body.repeatFrequency) {
          case 'daily':
            nextDate.setDate(nextDate.getDate() + 1);
            break;
          case 'weekly':
            nextDate.setDate(nextDate.getDate() + 7);
            break;
          case 'biweekly':
            nextDate.setDate(nextDate.getDate() + 14);
            break;
          case 'monthly':
            nextDate.setMonth(nextDate.getMonth() + 1);
            break;
          case 'quarterly':
            nextDate.setMonth(nextDate.getMonth() + 3);
            break;
        }
        currentDate = nextDate;
      }
      
      return NextResponse.json({
        success: true,
        data: transactions,
        message: `Created ${transactions.length} repeated transactions`
      }, { status: 201 });
    }
    
    // Single transaction (non-repeating)
    // Normalize amount based on transaction type
    const normalized = normalizeTransactionAmount(body);
    
    // Validate transaction
    const validation = validateTransaction(normalized);
    if (!validation.valid) {
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        errors: validation.errors
      }, { status: 400 });
    }
    
    // Create transaction
    const transaction = await createTransaction(normalized);
    
    return NextResponse.json({
      success: true,
      data: transaction
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
