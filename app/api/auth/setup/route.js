import { NextResponse } from 'next/server';
import { setPin, isPinSet } from '@/lib/models/auth';

export async function POST(request) {
  try {
    const { pin, securityQuestion, securityAnswer } = await request.json();
    
    if (!pin || pin.length !== 6 || !/^\d+$/.test(pin)) {
      return NextResponse.json(
        { error: 'PIN must be 6 digits' },
        { status: 400 }
      );
    }
    
    if (!securityQuestion || !securityAnswer) {
      return NextResponse.json(
        { error: 'Security question and answer are required' },
        { status: 400 }
      );
    }
    
    await setPin(pin, securityQuestion, securityAnswer);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Setup PIN error:', error);
    return NextResponse.json(
      { error: 'Failed to setup PIN' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const pinSet = await isPinSet();
    return NextResponse.json({ pinSet });
  } catch (error) {
    console.error('Check PIN status error:', error);
    return NextResponse.json(
      { error: 'Failed to check PIN status' },
      { status: 500 }
    );
  }
}
