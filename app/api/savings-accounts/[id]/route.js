import { NextResponse } from 'next/server';
import { getSavingsAccountById, updateSavingsAccount, deleteSavingsAccount } from '@/lib/models/savingsAccount';

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const existing = await getSavingsAccountById(id);
    if (!existing) {
      return NextResponse.json({
        success: false,
        error: 'Savings account not found'
      }, { status: 404 });
    }
    
    const updated = await updateSavingsAccount(id, {
      name: body.name,
      balance: parseFloat(body.balance)
    });
    
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
    
    const existing = await getSavingsAccountById(id);
    if (!existing) {
      return NextResponse.json({
        success: false,
        error: 'Savings account not found'
      }, { status: 404 });
    }
    
    const deleted = await deleteSavingsAccount(id);
    
    if (deleted) {
      return NextResponse.json({
        success: true
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Failed to delete savings account'
      }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
