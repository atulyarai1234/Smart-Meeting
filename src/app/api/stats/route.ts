import { NextResponse } from 'next/server';
import { getMeetingStats } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/stats - Get meeting statistics
export async function GET() {
  try {
    console.log('📊 API: Getting meeting statistics');
    
    const stats = await getMeetingStats();
    
    console.log(`✅ API: Returning stats - ${stats.total} total meetings`);

    return NextResponse.json(stats);

  } catch (error) {
    console.error('❌ API: Stats fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}