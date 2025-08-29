import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getMeeting, getTranscriptSegments } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

const GROQ_CHAT_URL = 'https://api.groq.com/openai/v1/chat/completions';

interface GroqMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface SummaryResult {
  tl_dr: string;
  decisions: Array<{
    decision: string;
    context: string;
    confidence: number;
  }>;
  risks: Array<{
    risk: string;
    impact: 'high' | 'medium' | 'low';
    likelihood: 'high' | 'medium' | 'low';
  }>;
  questions: Array<{
    question: string;
    category: 'technical' | 'business' | 'process' | 'other';
    urgency: 'high' | 'medium' | 'low';
  }>;
  action_items: Array<{
    task: string;
    assignee: string;
    due_date: string;
    priority: 'high' | 'medium' | 'low';
    source_quote: string;
  }>;
}

export async function POST(req: NextRequest) {
  try {
    const { meetingId } = await req.json();
    
    if (!meetingId) {
      return NextResponse.json({ error: 'Meeting ID required' }, { status: 400 });
    }

    console.log(`🤖 Starting Groq summarization for meeting ${meetingId}`);

    // 1. Get meeting and check status
    const meeting = await getMeeting(meetingId);
    if (!meeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    }

    if (meeting.status !== 'transcribed') {
      return NextResponse.json({ 
        error: 'Meeting must be transcribed first' 
      }, { status: 400 });
    }

    // 2. Get transcript segments
    const segments = await getTranscriptSegments(meetingId);
    if (segments.length === 0) {
      return NextResponse.json({ 
        error: 'No transcript found. Please transcribe first.' 
      }, { status: 400 });
    }

    // 3. Update meeting status to processing
    await supabaseAdmin
      .from('meetings')
      .update({ status: 'processing' })
      .eq('id', meetingId);

    // 4. Combine transcript segments with timestamps
    const fullTranscript = segments
      .map(segment => {
        const timestamp = `[${Math.floor(segment.start_s / 60)}:${(segment.start_s % 60).toFixed(0).padStart(2, '0')}]`;
        return `${timestamp} ${segment.text}`;
      })
      .join('\n');

    console.log(`📝 Processing transcript with ${segments.length} segments`);

    // 5. Create the system prompt for Groq
    const systemPrompt = `You are an expert meeting analyst. Analyze the meeting transcript and extract key information in JSON format.

Your task is to identify:
1. A concise TL;DR summary (2-3 sentences max)
2. Key decisions made (with context and confidence level 0.0-1.0)
3. Risks mentioned (with impact and likelihood assessment)
4. Open questions raised (categorized by urgency)
5. Action items (with assignees, due dates, priority, and exact source quote)

Guidelines:
- Be specific and accurate
- Only include information explicitly mentioned in the transcript
- For assignees: use actual names mentioned, or "unassigned" if unclear
- For due dates: extract actual dates mentioned, or "no date" if none specified
- For source quotes: use exact phrases from the transcript

Return ONLY valid JSON in this exact format:
{
  "tl_dr": "Brief summary of the meeting key outcomes...",
  "decisions": [
    {
      "decision": "What was decided",
      "context": "Why this decision was made",
      "confidence": 0.9
    }
  ],
  "risks": [
    {
      "risk": "Description of the risk mentioned",
      "impact": "high|medium|low",
      "likelihood": "high|medium|low"
    }
  ],
  "questions": [
    {
      "question": "What question was raised?",
      "category": "technical|business|process|other",
      "urgency": "high|medium|low"
    }
  ],
  "action_items": [
    {
      "task": "What needs to be done",
      "assignee": "Person responsible or 'unassigned'",
      "due_date": "YYYY-MM-DD or 'no date'",
      "priority": "high|medium|low",
      "source_quote": "Exact quote from transcript"
    }
  ]
}`;

    const messages: GroqMessage[] = [
      { role: 'system', content: systemPrompt },
      { 
        role: 'user', 
        content: `Please analyze this meeting transcript and extract the key information:\n\n${fullTranscript}` 
      }
    ];

    // 6. Call Groq Chat API
    console.log('🚀 Sending to Groq LLM...');
    
    const response = await fetch(GROQ_CHAT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',  // Fast and free Groq model
        messages: messages,
        max_tokens: 2000,
        temperature: 0.1,  // Low temperature for consistent structured output
        response_format: { type: 'json_object' }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Groq Chat API Error:', errorText);
      throw new Error(`Groq API error: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    const summaryText = result.choices[0].message.content;

    console.log('✅ Groq analysis completed');

    // 7. Parse the JSON response
    let summary: SummaryResult;
    try {
      summary = JSON.parse(summaryText);
    } catch (parseError) {
      console.error('Failed to parse Groq JSON:', summaryText);
      throw new Error('Invalid JSON response from Groq AI');
    }

    // 8. Save summary to database
    console.log('💾 Saving summary to database...');
    
    const { error: summaryError } = await supabaseAdmin
      .from('summaries')
      .insert({
        meeting_id: meetingId,
        tl_dr: summary.tl_dr,
        decisions: summary.decisions,
        risks: summary.risks,
        questions: summary.questions
      });

    if (summaryError) {
      throw new Error(`Failed to save summary: ${summaryError.message}`);
    }

    // 9. Save action items separately
    if (summary.action_items && summary.action_items.length > 0) {
      console.log(`📋 Saving ${summary.action_items.length} action items...`);
      
      const actionItemsToInsert = summary.action_items.map(item => ({
        meeting_id: meetingId,
        title: item.task,
        assignee: item.assignee === 'unassigned' ? null : item.assignee,
        due_date: item.due_date === 'no date' ? null : item.due_date,
        priority: item.priority,
        source_quote: item.source_quote,
        status: 'pending' as const
      }));

      const { error: actionItemsError } = await supabaseAdmin
        .from('action_items')
        .insert(actionItemsToInsert);

      if (actionItemsError) {
        console.error('Action items error:', actionItemsError);
        // Don't fail the whole process if action items fail
      }
    }

    // 10. Update meeting status to summarized
    await supabaseAdmin
      .from('meetings')
      .update({ status: 'summarized' })
      .eq('id', meetingId);

    console.log('🎉 Summarization complete!');

    return NextResponse.json({ 
      success: true,
      summary: {
        decisions_count: summary.decisions.length,
        risks_count: summary.risks.length,
        questions_count: summary.questions.length,
        action_items_count: summary.action_items.length
      }
    });

  } catch (error) {
    console.error('❌ Groq summarization error:', error);
    
    // Update meeting status back to transcribed on error
    try {
      const { meetingId } = await req.json();
      if (meetingId) {
        await supabaseAdmin
          .from('meetings')
          .update({ status: 'transcribed' })
          .eq('id', meetingId);
      }
    } catch (e) {
      console.error('Failed to revert status:', e);
    }

    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Summarization failed',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      }, 
      { status: 500 }
    );
  }
}