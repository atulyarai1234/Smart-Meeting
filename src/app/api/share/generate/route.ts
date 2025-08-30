import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

// Create a shareable link
export async function POST(req: NextRequest) {
  try {
    const { meetingId, expiresInDays = 30, includeTranscript = true } = await req.json();
    
    if (!meetingId) {
      return NextResponse.json({ error: 'Meeting ID required' }, { status: 400 });
    }

    console.log(`🔗 Creating share link for meeting ${meetingId}`);

    // Verify meeting exists and is processed
    const { data: meeting, error: meetingError } = await supabaseAdmin
      .from('meetings')
      .select('id, title, status')
      .eq('id', meetingId)
      .single();

    if (meetingError || !meeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    }

    if (meeting.status === 'created') {
      return NextResponse.json({ 
        error: 'Meeting must be processed before sharing' 
      }, { status: 400 });
    }

    // Generate share token
    const shareToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    console.log(`📝 Generated share token: ${shareToken.substring(0, 8)}...`);

    // Store share link in database
    const { error: insertError } = await supabaseAdmin
      .from('share_links')
      .insert({
        token: shareToken,
        meeting_id: meetingId,
        include_transcript: includeTranscript,
        expires_at: expiresAt.toISOString(),
        created_at: new Date().toISOString()
      });

    if (insertError) {
      console.error('Share link insert error:', insertError);
      throw new Error(`Failed to create share link: ${insertError.message}`);
    }

    const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/share/${shareToken}`;

    console.log(`✅ Share link created: ${shareUrl}`);

    return NextResponse.json({
      success: true,
      shareUrl,
      expiresAt: expiresAt.toISOString(),
      settings: {
        includeTranscript,
        expiresInDays
      }
    });

  } catch (error) {
    console.error('❌ Share link creation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create share link' },
      { status: 500 }
    );
  }
}