/**
 * API endpoint to initialize database indexes
 * 
 * This endpoint can be called to manually trigger database index creation.
 * It's also automatically called on first database access via mongodb.js
 * 
 * Requirements: 8.1-8.6
 */

import { initializeDatabase } from '@/lib/initDatabase';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    await initializeDatabase();
    
    return NextResponse.json({
      success: true,
      message: 'Database indexes initialized successfully',
      indexes: {
        transaction_templates: [
          'id (unique)',
          'active',
          'startDate',
          '(active, startDate, endDate) compound'
        ],
        template_exceptions: [
          '(templateId, occurrenceDate) compound unique',
          'templateId'
        ],
        transactions: [
          'id (unique)',
          'date',
          'templateId',
          'isPending',
          '(templateId, date) compound'
        ]
      }
    });
  } catch (error) {
    console.error('Error initializing database indexes:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to initialize database indexes',
        details: error.message
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Use POST method to initialize database indexes',
    indexes: {
      transaction_templates: [
        'id (unique)',
        'active',
        'startDate',
        '(active, startDate, endDate) compound'
      ],
      template_exceptions: [
        '(templateId, occurrenceDate) compound unique',
        'templateId'
      ],
      transactions: [
        'id (unique)',
        'date',
        'templateId',
        'isPending',
        '(templateId, date) compound'
      ]
    }
  });
}
