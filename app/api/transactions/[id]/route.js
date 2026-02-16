import { NextResponse } from 'next/server';
import { getTransactionById, updateTransaction, deleteTransaction } from '@/lib/models/transaction';
import { normalizeTransactionAmount } from '@/lib/transactions';

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    // Check if transaction exists
    const existing = await getTransactionById(id);
    if (!existing) {
      return NextResponse.json({
        success: false,
        error: 'Transaction not found'
      }, { status: 404 });
    }
    
    // Check if this is a recurring edit
    if (body.recurringEditMode && existing.tags && existing.tags.includes('Repeated')) {
      const { recurringEditMode, ...updateData } = body;
      
      // Normalize amount based on transaction type if amount or type is being updated
      let normalizedData = updateData;
      if (updateData.amount !== undefined || updateData.type !== undefined) {
        const transactionData = {
          ...existing,
          ...updateData
        };
        normalizedData = normalizeTransactionAmount(transactionData);
      }
      
      if (recurringEditMode === 'this') {
        // Edit only this occurrence
        const updated = await updateTransaction(id, normalizedData);
        return NextResponse.json({
          success: true,
          data: updated
        });
      } else if (recurringEditMode === 'future') {
        // Edit this and all future occurrences
        // Find all transactions with same company, amount, and type that are on or after this date
        const { getTransactions } = await import('@/lib/models/transaction');
        const allTransactions = await getTransactions();
        
        const currentDate = new Date(existing.date);
        const futureTransactions = allTransactions.filter(t => {
          const tDate = new Date(t.date);
          return t.tags && t.tags.includes('Repeated') &&
                 t.company === existing.company &&
                 t.type === existing.type &&
                 Math.abs(t.amount) === Math.abs(existing.amount) &&
                 tDate >= currentDate;
        });
        
        // Update all future transactions
        const updatePromises = futureTransactions.map(t => 
          updateTransaction(t.id, normalizedData)
        );
        
        await Promise.all(updatePromises);
        
        return NextResponse.json({
          success: true,
          data: { updated: futureTransactions.length },
          message: `Updated ${futureTransactions.length} transactions`
        });
      }
    }
    
    // Normal single transaction update
    let updateData = body;
    if (body.amount !== undefined || body.type !== undefined) {
      const transactionData = {
        ...existing,
        ...body
      };
      updateData = normalizeTransactionAmount(transactionData);
    }
    
    // Update transaction
    const updated = await updateTransaction(id, updateData);
    
    return NextResponse.json({
      success: true,
      data: updated
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    
    // Check if transaction exists
    const existing = await getTransactionById(id);
    if (!existing) {
      return NextResponse.json({
        success: false,
        error: 'Transaction not found'
      }, { status: 404 });
    }
    
    // Delete transaction
    const deleted = await deleteTransaction(id);
    
    if (deleted) {
      return NextResponse.json({
        success: true
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Failed to delete transaction'
      }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
