import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';

export async function DELETE() {
  try {
    const db = await getDb();
    
    // Delete all transactions
    const transactionsResult = await db.collection('transactions').deleteMany({});
    
    // Delete all recurring templates
    const templatesResult = await db.collection('recurringTemplates').deleteMany({});
    
    // Delete all savings accounts
    const savingsResult = await db.collection('savingsAccounts').deleteMany({});
    
    return NextResponse.json({
      success: true,
      data: {
        transactionsDeleted: transactionsResult.deletedCount,
        templatesDeleted: templatesResult.deletedCount,
        savingsAccountsDeleted: savingsResult.deletedCount
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
