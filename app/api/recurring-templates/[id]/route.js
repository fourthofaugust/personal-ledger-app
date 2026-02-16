import { NextResponse } from 'next/server';
import { 
  getRecurringTemplateById, 
  updateRecurringTemplate, 
  deleteRecurringTemplate 
} from '@/lib/models/recurringTemplate';

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    // Check if template exists
    const existing = await getRecurringTemplateById(id);
    if (!existing) {
      return NextResponse.json({
        success: false,
        error: 'Template not found'
      }, { status: 404 });
    }
    
    // Update template
    const updated = await updateRecurringTemplate(id, body);
    
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
    
    // Check if template exists
    const existing = await getRecurringTemplateById(id);
    if (!existing) {
      return NextResponse.json({
        success: false,
        error: 'Template not found'
      }, { status: 404 });
    }
    
    // Delete template (existing transactions are preserved)
    const deleted = await deleteRecurringTemplate(id);
    
    if (deleted) {
      return NextResponse.json({
        success: true
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Failed to delete template'
      }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
