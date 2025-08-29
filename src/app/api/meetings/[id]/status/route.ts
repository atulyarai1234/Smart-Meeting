import { NextRequest, NextResponse } from 'next/server';
import { getMeeting } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params first (Next.js 15+ requirement)
    const { id } = await params;
    const meeting = await getMeeting(id);
    
    if (!meeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    }

    return NextResponse.json({
      status: meeting.status,
      id: meeting.id,
      title: meeting.title
    });
    
  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json(
      { error: 'Failed to check status' },
      { status: 500 }
    );
  }
}