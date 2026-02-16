import { NextResponse } from 'next/server';
import { getClient } from '@/lib/mongodb';

/**
 * GET /api/analytics
 * Calculate analytics including balance up to a date
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const endDate = searchParams.get('endDate');
    const includeUnpaid = searchParams.get('includeUnpaid') === 'true';
    
    if (!endDate) {
      return NextResponse.json({ error: 'endDate is required' }, { status: 400 });
    }

    const client = await getClient();
    const db = client.db('ledger');
    const transactionsCollection = db.collection('transactions');

    // Parse endDate and set to end of day
    const endDateTime = new Date(endDate);
    endDateTime.setHours(23, 59, 59, 999);

    // Build match criteria - handle both string and Date formats
    const matchCriteria = {
      $or: [
        { date: { $lte: endDateTime } }, // Date objects
        { date: { $lte: endDateTime.toISOString().split('T')[0] } } // String dates (YYYY-MM-DD)
      ]
    };
    
    if (!includeUnpaid) {
      matchCriteria.paid = true;
    }

    console.log('Analytics query:', {
      endDate: endDateTime,
      endDateString: endDateTime.toISOString().split('T')[0],
      includeUnpaid,
      matchCriteria: JSON.stringify(matchCriteria)
    });

    // Calculate balance using aggregation
    const result = await transactionsCollection.aggregate([
      { $match: matchCriteria },
      {
        $group: {
          _id: null,
          balance: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]).toArray();

    const balance = result.length > 0 ? result[0].balance : 0;
    const count = result.length > 0 ? result[0].count : 0;

    console.log('Analytics result:', { balance, count });

    return NextResponse.json({ balance, count });
  } catch (error) {
    console.error('Analytics calculation error:', error);
    return NextResponse.json(
      { error: 'Failed to calculate analytics' },
      { status: 500 }
    );
  }
}
