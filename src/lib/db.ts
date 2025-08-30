import { supabaseAdmin } from './supabaseAdmin';
import type { Meeting, TranscriptSegment, Summary, ActionItem, MeetingWithCounts } from '../types';

export async function createMeeting(title: string): Promise<Meeting> {
  const { data, error } = await supabaseAdmin
    .from('meetings')
    .insert({ title, source: 'manual', status: 'created' })
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function getMeeting(id: string): Promise<Meeting> {
  const { data, error } = await supabaseAdmin
    .from('meetings')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function getTranscriptSegments(meetingId: string): Promise<TranscriptSegment[]> {
  const { data, error } = await supabaseAdmin
    .from('transcript_segments')
    .select('*')
    .eq('meeting_id', meetingId)
    .order('start_s', { ascending: true });
  
  if (error) throw error;
  return data || [];
}

export async function getMeetingSummary(meetingId: string): Promise<Summary | null> {
  const { data, error } = await supabaseAdmin
    .from('summaries')
    .select('*')
    .eq('meeting_id', meetingId)
    .single();
  
  if (error) {
    // Return null if no summary found, but throw on other errors
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data;
}

export async function getActionItems(meetingId: string): Promise<ActionItem[]> {
  const { data, error } = await supabaseAdmin
    .from('action_items')
    .select('*')
    .eq('meeting_id', meetingId)
    .order('created_at', { ascending: true });
  
  if (error) throw error;
  return data || [];
}

export async function updateMeetingStatus(meetingId: string, status: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('meetings')
    .update({ status })
    .eq('id', meetingId);
  
  if (error) throw error;
}

// Homepage-specific queries
export async function getAllMeetings(
  limit = 50,
  offset = 0,
  searchQuery?: string,
  statusFilter?: string
): Promise<MeetingWithCounts[]> {
  let query = supabaseAdmin
    .from('meetings')
    .select(`
      id,
      title,
      status,
      created_at,
      transcript_segments!inner(count),
      action_items(count),
      summaries(id)
    `);

  // Add search filter
  if (searchQuery && searchQuery.trim()) {
    query = query.ilike('title', `%${searchQuery.trim()}%`);
  }

  // Add status filter
  if (statusFilter && statusFilter !== 'all') {
    query = query.eq('status', statusFilter);
  }

  // Order and pagination
  const { data, error } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;

  // Transform the data to include counts and duration
  const meetings: MeetingWithCounts[] = [];
  
  for (const meeting of data || []) {
    // Get transcript segments to calculate duration
    const { data: segments } = await supabaseAdmin
      .from('transcript_segments')
      .select('end_s')
      .eq('meeting_id', meeting.id);

    const duration = segments && segments.length > 0 
      ? Math.max(...segments.map(s => s.end_s))
      : undefined;

    meetings.push({
      id: meeting.id,
      title: meeting.title,
      status: meeting.status,
      created_at: meeting.created_at,
      transcript_count: meeting.transcript_segments?.[0]?.count || 0,
      action_items_count: meeting.action_items?.[0]?.count || 0,
      has_summary: !!meeting.summaries?.[0]?.id,
      duration
    });
  }

  return meetings;
}

export async function getMeetingStats() {
  // Get total counts by status
  const { data: statusCounts, error: statusError } = await supabaseAdmin
    .from('meetings')
    .select('status')
    .order('created_at', { ascending: false });

  if (statusError) throw statusError;

  // Count by status
  const stats = {
    total: statusCounts?.length || 0,
    created: statusCounts?.filter(m => m.status === 'created').length || 0,
    processing: statusCounts?.filter(m => m.status === 'processing').length || 0,
    transcribed: statusCounts?.filter(m => m.status === 'transcribed').length || 0,
    summarized: statusCounts?.filter(m => m.status === 'summarized').length || 0,
    error: statusCounts?.filter(m => m.status === 'error').length || 0,
  };

  // Get total transcript segments
  const { count: totalSegments } = await supabaseAdmin
    .from('transcript_segments')
    .select('*', { count: 'exact', head: true });

  // Get total action items
  const { count: totalActionItems } = await supabaseAdmin
    .from('action_items')
    .select('*', { count: 'exact', head: true });

  return {
    ...stats,
    totalSegments: totalSegments || 0,
    totalActionItems: totalActionItems || 0
  };
}

export async function getRecentMeetings(limit = 5): Promise<MeetingWithCounts[]> {
  const { data, error } = await supabaseAdmin
    .from('meetings')
    .select('id, title, status, created_at')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;

  return (data || []).map(meeting => ({
    ...meeting,
    transcript_count: 0,
    action_items_count: 0,
    has_summary: false
  }));
}