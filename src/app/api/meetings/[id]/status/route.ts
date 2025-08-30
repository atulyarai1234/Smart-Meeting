import { NextRequest, NextResponse } from 'next/server';
import { getAllMeetings, getMeetingStats } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/meetings - Get all meetings with optional search and filter
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search') || undefined;
    const status = searchParams.get('status') || undefined;
    const includeStats = searchParams.get('includeStats') === 'true';

    console.log(`🔍 API: Getting meetings - limit:${limit}, offset:${offset}, search:"${search}", status:"${status}"`);

    // Get meetings
    const meetings = await getAllMeetings(limit, offset, search, status);

    // Optionally include stats
    let stats = null;
    if (includeStats) {
      stats = await getMeetingStats();
    }

    console.log(`✅ API: Returning ${meetings.length} meetings`);

    return NextResponse.json({
      meetings,
      stats,
      pagination: {
        limit,
        offset,
        total: meetings.length
      }
    });

  } catch (error) {
    console.error('❌ API: Meetings fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch meetings' },
      { status: 500 }
    );
  }
}