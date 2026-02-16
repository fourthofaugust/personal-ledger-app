import { NextResponse } from 'next/server';
import { getActiveTemplates, updateRecurringTemplate } from '@/lib/models/recurringTemplate';
import { createTransaction, getTransactions } from '@/lib/models/transaction';
import { processAllTemplates } from '@/lib/recurring';

export async function POST() {
  try {
    const templates = await getActiveTemplates();
    const currentDate = new Date();
    
    // Get all existing transactions to check for duplicates
    const existingTransactions = await getTransactions();
    
    const newTransactions = processAllTemplates(templates, currentDate);
    
    const created = [];
    const templateLastDates = {}; // Track the latest date for each template
    
    for (const transactionData of newTransactions) {
      const templateId = transactionData.templateId;
      const transactionDate = new Date(transactionData.date + 'T00:00:00');
      
      // Check if this transaction already exists (same templateId, date, and company)
      const isDuplicate = existingTransactions.some(t => 
        t.templateId === transactionData.templateId && 
        t.date === transactionData.date &&
        t.company === transactionData.company
      );
      
      if (!isDuplicate) {
        const transaction = await createTransaction(transactionData);
        created.push(transaction);
      }
      
      // Track the latest transaction date for each template (even if duplicate)
      // This ensures we don't keep trying to generate the same transactions
      if (!templateLastDates[templateId] || transactionDate > templateLastDates[templateId]) {
        templateLastDates[templateId] = transactionDate;
      }
    }
    
    // Update each template's lastGenerated date to the latest transaction date
    // This happens even if all transactions were duplicates
    for (const [templateId, lastDate] of Object.entries(templateLastDates)) {
      await updateRecurringTemplate(templateId, {
        lastGenerated: lastDate.toISOString().split('T')[0]
      });
    }
    
    return NextResponse.json({
      success: true,
      data: {
        generated: created.length,
        transactions: created
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
