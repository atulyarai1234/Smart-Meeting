import { supabaseAdmin } from './supabaseAdmin';
import type { Meeting, TranscriptSegment, Summary, ActionItem } from '../types';

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

// Helper function to format time for display
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Helper to format date for display
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}