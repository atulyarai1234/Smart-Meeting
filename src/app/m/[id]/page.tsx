import { getMeeting, getTranscriptSegments, getMeetingSummary, getActionItems, formatTime, formatDate } from '@/lib/db';
import { TranscribeButton } from '@/components/TranscribeButton';
import { SummarizeButton } from '@/components/SummarizeButton';
import Link from 'next/link';
import type { Meeting, TranscriptSegment, Summary, ActionItem } from '@/types';

export const dynamic = 'force-dynamic';

async function getMeetingData(id: string): Promise<Meeting | null> {
  try {
    return await getMeeting(id);
  } catch {
    return null;
  }
}

async function getTranscriptData(meetingId: string): Promise<TranscriptSegment[]> {
  try {
    return await getTranscriptSegments(meetingId);
  } catch {
    return [];
  }
}

async function getSummaryData(meetingId: string): Promise<Summary | null> {
  try {
    return await getMeetingSummary(meetingId);
  } catch {
    return null;
  }
}

async function getActionItemsData(meetingId: string): Promise<ActionItem[]> {
  try {
    return await getActionItems(meetingId);
  } catch {
    return [];
  }
}

function StatusBadge({ status }: { status: string }) {
  const statusConfig = {
    created: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Created' },
    processing: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Processing...' },
    transcribed: { bg: 'bg-green-100', text: 'text-green-800', label: 'Transcribed' },
    summarized: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Summarized' },
    error: { bg: 'bg-red-100', text: 'text-red-800', label: 'Error' }
  };
  
  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.created;
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
}

function TranscriptSegmentComponent({ segment }: { segment: TranscriptSegment }) {
  return (
    <div className="flex gap-4 p-4 hover:bg-gray-50 rounded-lg border-l-2 border-gray-200 hover:border-blue-300 transition-colors">
      <div className="flex-shrink-0 w-16">
        <span className="text-sm font-mono text-gray-500">
          {formatTime(segment.start_s)}
        </span>
      </div>
      <div className="flex-1">
        {segment.speaker && (
          <div className="text-sm font-medium text-gray-700 mb-1">
            {segment.speaker}
          </div>
        )}
        <p className="text-gray-900 leading-relaxed">{segment.text}</p>
      </div>
    </div>
  );
}

function SummarySection({ summary }: { summary: Summary }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="bg-purple-50 px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          🤖 AI Summary
        </h2>
      </div>
      
      <div className="p-6 space-y-6">
        {/* TL;DR */}
        {summary.tl_dr && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Key Takeaway</h3>
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
              <p className="text-blue-900">{summary.tl_dr}</p>
            </div>
          </div>
        )}

        {/* Decisions */}
        {summary.decisions && summary.decisions.length > 0 && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Decisions Made</h3>
            <div className="space-y-3">
              {summary.decisions.map((decision, index) => (
                <div key={index} className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-green-900">Decision</h4>
                    <span className="text-sm text-green-700">
                      Confidence: {Math.round(decision.confidence * 100)}%
                    </span>
                  </div>
                  <p className="text-green-800 mb-2">{decision.decision}</p>
                  <p className="text-sm text-green-700">Context: {decision.context}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Risks */}
        {summary.risks && summary.risks.length > 0 && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Risks Identified</h3>
            <div className="space-y-3">
              {summary.risks.map((risk, index) => (
                <div key={index} className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-yellow-900 font-medium mb-2">{risk.risk}</p>
                  <div className="flex gap-4 text-sm">
                    <span className="text-yellow-700">
                      Impact: <span className="font-medium">{risk.impact}</span>
                    </span>
                    <span className="text-yellow-700">
                      Likelihood: <span className="font-medium">{risk.likelihood}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Questions */}
        {summary.questions && summary.questions.length > 0 && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Open Questions</h3>
            <div className="space-y-3">
              {summary.questions.map((question, index) => (
                <div key={index} className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <p className="text-orange-900 font-medium mb-2">{question.question}</p>
                  <div className="flex gap-4 text-sm">
                    <span className="text-orange-700">
                      Category: <span className="font-medium">{question.category}</span>
                    </span>
                    <span className="text-orange-700">
                      Urgency: <span className="font-medium">{question.urgency}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ActionItemsSection({ actionItems }: { actionItems: ActionItem[] }) {
  if (actionItems.length === 0) return null;

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="bg-indigo-50 px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          📋 Action Items ({actionItems.length})
        </h2>
      </div>
      
      <div className="divide-y divide-gray-200">
        {actionItems.map((item) => (
          <div key={item.id} className="p-6">
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-lg font-medium text-gray-900">{item.title}</h3>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                item.priority === 'high' ? 'bg-red-100 text-red-800' :
                item.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800'
              }`}>
                {item.priority} priority
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
              <div>
                <span className="font-medium">Assignee:</span> {item.assignee || 'Unassigned'}
              </div>
              <div>
                <span className="font-medium">Due Date:</span> {
                  item.due_date ? formatDate(item.due_date) : 'No date set'
                }
              </div>
            </div>
            
            {item.source_quote && (
              <div className="bg-gray-50 border-l-4 border-gray-300 p-3 text-sm">
                <span className="font-medium text-gray-700">From transcript:</span>
                <p className="text-gray-600 italic mt-1">&ldquo;{item.source_quote}&rdquo;</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function MeetingPage({ params }: { params: Promise<{ id: string }> }) {
  // Await params first (Next.js 15+ requirement)
  const { id } = await params;
  
  const meeting = await getMeetingData(id);
  
  if (!meeting) {
    return (
      <div className="space-y-4">
        <div className="text-red-600 font-medium">Meeting not found</div>
        <Link href="/" className="text-blue-600 hover:underline">
          ← Back to home
        </Link>
      </div>
    );
  }

  // Fetch all data in parallel
  const [transcript, summary, actionItems] = await Promise.all([
    getTranscriptData(id),
    getSummaryData(id),
    getActionItemsData(id)
  ]);

  const totalDuration = transcript.length > 0 ? Math.max(...transcript.map(s => s.end_s)) : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">{meeting.title}</h1>
          <StatusBadge status={meeting.status} />
        </div>
        
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span>Created: {formatDate(meeting.created_at)}</span>
          {totalDuration > 0 && (
            <span>Duration: {formatTime(totalDuration)}</span>
          )}
          {transcript.length > 0 && (
            <span>{transcript.length} segments</span>
          )}
          {summary && (
            <>
              {summary.decisions && summary.decisions.length > 0 && (
                <span>{summary.decisions.length} decisions</span>
              )}
              {actionItems.length > 0 && (
                <span>{actionItems.length} action items</span>
              )}
            </>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        {meeting.status === 'created' && (
          <TranscribeButton meetingId={meeting.id} />
        )}
        
        {meeting.status === 'transcribed' && (
          <SummarizeButton meetingId={meeting.id} />
        )}
        
        <Link 
          href="/" 
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
        >
          ← Back to Home
        </Link>
      </div>

      {/* Status-specific content */}
      {meeting.status === 'processing' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <div>
              <h3 className="text-lg font-medium text-blue-900">Processing Recording</h3>
              <p className="text-blue-700">
                {meeting.status === 'processing' && transcript.length === 0
                  ? 'Transcribing your audio... This may take a few minutes depending on the file size.'
                  : 'Analyzing transcript and generating summary...'}
              </p>
            </div>
          </div>
        </div>
      )}

      {meeting.status === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-red-900 mb-2">Processing Error</h3>
          <p className="text-red-700">
            There was an error processing your recording. Please try uploading again or contact support.
          </p>
        </div>
      )}

      {/* Summary Section */}
      {summary && <SummarySection summary={summary} />}

      {/* Action Items Section */}
      {actionItems.length > 0 && <ActionItemsSection actionItems={actionItems} />}

      {/* Transcript Section */}
      {transcript.length > 0 && (
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Transcript
            {!summary && meeting.status === 'transcribed' && (
              <span className="ml-3 text-sm font-normal text-gray-500">
                → Generate summary to extract key insights
              </span>
            )}
          </h2>
          <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100 max-h-96 overflow-y-auto">
            {transcript.map(segment => (
              <TranscriptSegmentComponent 
                key={segment.id} 
                segment={segment} 
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty state for newly created meetings */}
      {meeting.status === 'created' && transcript.length === 0 && (
        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to Process</h3>
          <p className="text-gray-600 mb-4">
            Click &ldquo;Start Transcription&rdquo; to begin processing your uploaded recording.
          </p>
        </div>
      )}
    </div>
  );
}