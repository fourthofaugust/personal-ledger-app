import { NextResponse } from 'next/server';
import { verifyPin } from '@/lib/models/auth';

export async function POST(request) {
  try {
    const { pin } = await request.json();
    
    if (!pin || pin.length !== 6 || !/^\d+$/.test(pin)) {
      return NextResponse.json(
        { error: 'Invalid PIN format' },
        { status: 400 }
      );
    }
    
    const isValid = await verifyPin(pin);
    
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid PIN' },
        { status: 401 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Verify PIN error:', error);
    return NextResponse.json(
      { error: 'Failed to verify PIN' },
      { status: 500 }
    );
  }
}
