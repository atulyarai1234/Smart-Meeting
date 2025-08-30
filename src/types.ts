// Database types
export interface Meeting {
  id: string;
  workspace_id?: string;
  source: 'manual' | 'zoom' | 'google_meet';
  external_id?: string;
  title: string;
  start_ts?: string;
  end_ts?: string;
  recording_url?: string;
  status: 'created' | 'processing' | 'transcribed' | 'summarized' | 'error';
  created_at: string;
}

export interface MeetingWithCounts {
  id: string;
  title: string;
  status: 'created' | 'processing' | 'transcribed' | 'summarized' | 'error';
  created_at: string;
  transcript_count?: number;
  action_items_count?: number;
  has_summary: boolean;
  duration?: number;
}

export interface TranscriptSegment {
  id: string;
  meeting_id: string;
  start_s: number;
  end_s: number;
  speaker?: string;
  text: string;
}

export interface Summary {
  id: string;
  meeting_id: string;
  tl_dr?: string;
  decisions?: Decision[];
  risks?: Risk[];
  questions?: Question[];
  created_at: string;
}

export interface Decision {
  decision: string;
  context: string;
  confidence: number;
}

export interface Risk {
  risk: string;
  impact: string;
  likelihood: string;
}

export interface Question {
  question: string;
  category: string;
  urgency: string;
}

export interface ActionItem {
  id: string;
  meeting_id: string;
  title: string;
  assignee?: string;
  due_date?: string;
  priority?: 'low' | 'medium' | 'high';
  source_quote?: string;
  tool?: string;
  external_id?: string;
  status: 'pending' | 'synced' | 'done';
  created_at: string;
}

export interface Participant {
  id: string;
  meeting_id: string;
  name?: string;
  email?: string;
  role?: string;
  created_at: string;
}

// API response types
export interface TranscriptionResult {
  success: boolean;
  segmentCount: number;
  duration: number;
  language: string;
}

export interface ApiError {
  error: string;
  details?: Record<string, unknown>;
}

// Component props
export interface MeetingPageProps {
  params: Promise<{ id: string }>; // Updated for Next.js 15+
}

export interface TranscribeButtonProps {
  meetingId: string;
}