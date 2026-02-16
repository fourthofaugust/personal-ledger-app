import { NextResponse } from 'next/server';
import { getSavingsAccounts, createSavingsAccount } from '@/lib/models/savingsAccount';

export async function GET() {
  try {
    const accounts = await getSavingsAccounts();
    
    return NextResponse.json({
      success: true,
      data: accounts
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
    
    // Validate required fields
    if (!body.name || body.balance === undefined) {
      return NextResponse.json({
        success: false,
        error: 'Name and balance are required'
      }, { status: 400 });
    }
    
    const account = await createSavingsAccount({
      name: body.name,
      balance: parseFloat(body.balance)
    });
    
    return NextResponse.json({
      success: true,
      data: account
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
