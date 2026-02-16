import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';

export async function POST(request) {
  try {
    const body = await request.json();
    
    if (!body.data || !body.data.transactions) {
      return NextResponse.json({
        success: false,
        error: 'Invalid backup format'
      }, { status: 400 });
    }
    
    const db = await getDb();
    
    // Clear existing data
    await db.collection('transactions').deleteMany({});
    await db.collection('recurringTemplates').deleteMany({});
    await db.collection('savingsAccounts').deleteMany({});
    
    // Insert backup data
    const transactionsResult = body.data.transactions.length > 0 
      ? await db.collection('transactions').insertMany(body.data.transactions)
      : { insertedCount: 0 };
      
    const templatesResult = body.data.recurringTemplates && body.data.recurringTemplates.length > 0
      ? await db.collection('recurringTemplates').insertMany(body.data.recurringTemplates)
      : { insertedCount: 0 };
    
    const savingsResult = body.data.savingsAccounts && body.data.savingsAccounts.length > 0
      ? await db.collection('savingsAccounts').insertMany(body.data.savingsAccounts)
      : { insertedCount: 0 };
    
    return NextResponse.json({
      success: true,
      data: {
        transactionsRestored: transactionsResult.insertedCount,
        templatesRestored: templatesResult.insertedCount,
        savingsAccountsRestored: savingsResult.insertedCount
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
