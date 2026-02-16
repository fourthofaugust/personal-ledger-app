import { NextResponse } from 'next/server';
import { getRecurringTemplates, createRecurringTemplate } from '@/lib/models/recurringTemplate';
import { validateRecurringTemplate } from '@/lib/recurring';

export async function GET() {
  try {
    const templates = await getRecurringTemplates();
    
    return NextResponse.json({
      success: true,
      data: templates
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
    
    // Validate template
    const validation = validateRecurringTemplate(body);
    if (!validation.valid) {
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        errors: validation.errors
      }, { status: 400 });
    }
    
    // Create template
    const template = await createRecurringTemplate(body);
    
    return NextResponse.json({
      success: true,
      data: template
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
