import { NextResponse } from 'next/server';
import { getTransactions } from '@/lib/models/transaction';
import { getRecurringTemplates } from '@/lib/models/recurringTemplate';
import { getSavingsAccounts } from '@/lib/models/savingsAccount';

export async function GET() {
  try {
    const transactions = await getTransactions();
    const templates = await getRecurringTemplates();
    const savingsAccounts = await getSavingsAccounts();
    
    const backup = {
      version: '2.0',
      exportDate: new Date().toISOString(),
      data: {
        transactions,
        recurringTemplates: templates,
        savingsAccounts
      }
    };
    
    return NextResponse.json({
      success: true,
      data: backup
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
