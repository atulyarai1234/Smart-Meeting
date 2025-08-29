import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getMeeting } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const GROQ_API_URL = 'https://api.groq.com/openai/v1/audio/transcriptions';

interface GroqSegment {
  id: number;
  start: number;
  end: number;
  text: string;
}

interface GroqResponse {
  text: string;
  segments?: GroqSegment[];
  language?: string;
}

export async function POST(req: NextRequest) {
  try {
    const { meetingId } = await req.json();
    
    if (!meetingId) {
      return NextResponse.json({ error: 'Meeting ID required' }, { status: 400 });
    }

    console.log(`🎙️ Starting Groq transcription for meeting ${meetingId}`);

    // 1. Get meeting details
    const meeting = await getMeeting(meetingId);
    if (!meeting || meeting.status !== 'created') {
      return NextResponse.json({ 
        error: 'Meeting not found or already processed' 
      }, { status: 400 });
    }

    // 2. Update status to processing
    await supabaseAdmin
      .from('meetings')
      .update({ status: 'processing' })
      .eq('id', meetingId);

    console.log('📁 Finding uploaded audio file...');

    // 3. Get the uploaded file
    const { data: files, error: listError } = await supabaseAdmin.storage
      .from('recordings')
      .list('', { search: meetingId });

    if (listError || !files || files.length === 0) {
      throw new Error('Recording file not found in storage');
    }

    const recordingFile = files[0];
    console.log(`📥 Found file: ${recordingFile.name}, size: ${recordingFile.metadata?.size || 'unknown'}`);

    // 4. Download the file
    const { data: fileData, error: downloadError } = await supabaseAdmin.storage
      .from('recordings')
      .download(recordingFile.name);

    if (downloadError || !fileData) {
      throw new Error(`Failed to download recording: ${downloadError?.message}`);
    }

    console.log('🚀 Sending to Groq API...');

    // 5. Prepare form data for Groq API
    const formData = new FormData();
    formData.append('file', new File([fileData], recordingFile.name, {
      type: fileData.type || 'audio/mpeg'
    }));
    formData.append('model', 'whisper-large-v3');
    formData.append('response_format', 'verbose_json');
    formData.append('language', 'en'); // Remove this line for auto-detect

    // 6. Call Groq API
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Groq API Error:', errorText);
      throw new Error(`Groq API error: ${response.status} ${errorText}`);
    }

    const transcription: GroqResponse = await response.json();
    console.log('✅ Groq transcription completed!');

    // 7. Process segments
    let segments = [];
    
    if (transcription.segments && transcription.segments.length > 0) {
      // Use actual segments if available
      console.log(`📝 Processing ${transcription.segments.length} segments`);
      segments = transcription.segments.map(segment => ({
        meeting_id: meetingId,
        start_s: segment.start,
        end_s: segment.end,
        text: segment.text.trim(),
        speaker: null
      }));
    } else {
      // Fallback: create artificial segments by splitting text
      console.log('📄 Creating artificial segments from full text');
      const words = transcription.text.split(' ');
      const wordsPerSegment = 50; // ~30 seconds of speech
      const estimatedDuration = words.length * 0.6; // ~0.6 seconds per word
      
      for (let i = 0; i < words.length; i += wordsPerSegment) {
        const segmentWords = words.slice(i, i + wordsPerSegment);
        const startTime = (i / words.length) * estimatedDuration;
        const endTime = Math.min(((i + wordsPerSegment) / words.length) * estimatedDuration, estimatedDuration);
        
        segments.push({
          meeting_id: meetingId,
          start_s: startTime,
          end_s: endTime,
          text: segmentWords.join(' '),
          speaker: null
        });
      }
    }

    // 8. Save segments to database
    if (segments.length > 0) {
      console.log(`💾 Saving ${segments.length} segments to database`);
      const { error: insertError } = await supabaseAdmin
        .from('transcript_segments')
        .insert(segments);

      if (insertError) {
        throw new Error(`Failed to save segments: ${insertError.message}`);
      }
    }

    // 9. Update meeting status to transcribed
    await supabaseAdmin
      .from('meetings')
      .update({ status: 'transcribed' })
      .eq('id', meetingId);

    console.log(`🎉 Transcription complete! Generated ${segments.length} segments`);

    return NextResponse.json({ 
      success: true,
      segmentCount: segments.length,
      provider: 'groq',
      language: transcription.language || 'unknown'
    });

  } catch (error) {
    console.error('❌ Groq transcription error:', error);
    
    // Update meeting status to error
    try {
      const { meetingId } = await req.json();
      if (meetingId) {
        await supabaseAdmin
          .from('meetings')
          .update({ status: 'error' })
          .eq('id', meetingId);
      }
    } catch (e) {
      console.error('Failed to update error status:', e);
    }

    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Transcription failed',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      }, 
      { status: 500 }
    );
  }
}