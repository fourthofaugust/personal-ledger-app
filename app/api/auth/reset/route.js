import { NextResponse } from 'next/server';
import { resetPin, getAuth } from '@/lib/models/auth';

export async function POST(request) {
  try {
    const { newPin, securityAnswer } = await request.json();
    
    if (!newPin || newPin.length !== 6 || !/^\d+$/.test(newPin)) {
      return NextResponse.json(
        { error: 'PIN must be 6 digits' },
        { status: 400 }
      );
    }
    
    if (!securityAnswer) {
      return NextResponse.json(
        { error: 'Security answer is required' },
        { status: 400 }
      );
    }
    
    await resetPin(newPin, securityAnswer);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Reset PIN error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to reset PIN' },
      { status: 401 }
    );
  }
}

export async function GET() {
  try {
    const auth = await getAuth();
    if (!auth || !auth.securityQuestion) {
      return NextResponse.json(
        { error: 'No security question set' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ securityQuestion: auth.securityQuestion });
  } catch (error) {
    console.error('Get security question error:', error);
    return NextResponse.json(
      { error: 'Failed to get security question' },
      { status: 500 }
    );
  }
}
