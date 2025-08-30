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

    // Store share link in database (we'll need to create this table)
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
      throw new Error(`Failed to create share link: ${insertError.message}`);
    }

    const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/share/${shareToken}`;

    return NextResponse.json({
      success: true,
      shareUrl,
      expiresAt: expiresAt.toISOString()
    });

  } catch (error) {
    console.error('Share link creation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create share link' },
      { status: 500 }
    );
  }
}

// Get shared meeting data
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    // Find share link
    const { data: shareLink, error: shareLinkError } = await supabaseAdmin
      .from('share_links')
      .select('*')
      .eq('token', token)
      .single();

    if (shareLinkError || !shareLink) {
      return NextResponse.json({ error: 'Share link not found or expired' }, { status: 404 });
    }

    // Check if link is expired
    if (new Date() > new Date(shareLink.expires_at)) {
      return NextResponse.json({ error: 'Share link has expired' }, { status: 410 });
    }

    // Get meeting data
    const { data: meeting, error: meetingError } = await supabaseAdmin
      .from('meetings')
      .select('id, title, status, created_at')
      .eq('id', shareLink.meeting_id)
      .single();

    if (meetingError || !meeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    }

    // Get summary
    const { data: summary } = await supabaseAdmin
      .from('summaries')
      .select('*')
      .eq('meeting_id', shareLink.meeting_id)
      .single();

    // Get action items
    const { data: actionItems } = await supabaseAdmin
      .from('action_items')
      .select('*')
      .eq('meeting_id', shareLink.meeting_id)
      .order('created_at', { ascending: true });

    // Get transcript (only if included in share settings)
    let transcript = [];
    if (shareLink.include_transcript) {
      const { data: transcriptData } = await supabaseAdmin
        .from('transcript_segments')
        .select('*')
        .eq('meeting_id', shareLink.meeting_id)
        .order('start_s', { ascending: true });
      
      transcript = transcriptData || [];
    }

    return NextResponse.json({
      meeting,
      summary: summary || null,
      actionItems: actionItems || [],
      transcript,
      shareSettings: {
        includeTranscript: shareLink.include_transcript,
        expiresAt: shareLink.expires_at
      }
    });

  } catch (error) {
    console.error('Share link access error:', error);
    return NextResponse.json(
      { error: 'Failed to access shared meeting' },
      { status: 500 }
    );
  }
}