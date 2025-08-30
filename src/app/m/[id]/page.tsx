import { getMeeting, getTranscriptSegments, getMeetingSummary, getActionItems } from '@/lib/db';
import { formatTime, formatDate } from '@/lib/utils';
import { TranscribeButton } from '@/components/TranscribeButton';
import { SummarizeButton } from '@/components/SummarizeButton';
import { ExportButtons } from '@/components/ExportButtons';
import { Navigation } from '@/components/Navigation';
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
    <div className="min-h-screen bg-gray-50">
      <Navigation currentPage="meeting" />
      
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Link href="/" className="hover:text-gray-900 transition-colors">Dashboard</Link>
          <span>›</span>
          <span className="text-gray-900 font-medium">{meeting.title}</span>
        </div>

        {/* Header */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{meeting.title}</h1>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>📅 Created {formatDate(meeting.created_at)}</span>
                {totalDuration > 0 && (
                  <span>⏱️ Duration {formatTime(totalDuration)}</span>
                )}
                {transcript.length > 0 && (
                  <span>📝 {transcript.length} segments</span>
                )}
                {summary && (
                  <>
                    {summary.decisions && summary.decisions.length > 0 && (
                      <span>✅ {summary.decisions.length} decisions</span>
                    )}
                    {actionItems.length > 0 && (
                      <span>📋 {actionItems.length} action items</span>
                    )}
                  </>
                )}
              </div>
            </div>
            <StatusBadge status={meeting.status} />
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3">
            {meeting.status === 'created' && (
              <TranscribeButton meetingId={meeting.id} />
            )}
            
            {meeting.status === 'transcribed' && (
              <SummarizeButton meetingId={meeting.id} />
            )}
            
            <Link 
              href="/" 
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Dashboard
            </Link>
          </div>
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

        {/* Export & Share Section */}
        {(meeting.status === 'transcribed' || meeting.status === 'summarized') && transcript.length > 0 && (
          <ExportButtons 
            data={{
              meeting,
              summary,
              actionItems,
              transcript
            }}
          />
        )}

        {/* Summary Section */}
        {summary && (
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
        )}

        {/* Action Items Section */}
        {actionItems.length > 0 && (
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
        )}

        {/* Transcript Section */}
        {transcript.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                📝 Transcript
                {!summary && meeting.status === 'transcribed' && (
                  <span className="ml-3 text-sm font-normal text-gray-500">
                    → Generate summary to extract key insights
                  </span>
                )}
              </h2>
            </div>
            <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
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
          <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
            <div className="text-gray-400 text-6xl mb-4">🎙️</div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">Ready to Process</h3>
            <p className="text-gray-600 mb-6">
              Click &ldquo;Start Transcription&rdquo; to begin processing your uploaded recording.
            </p>
            <div className="bg-white rounded-lg p-4 text-left max-w-md mx-auto">
              <h4 className="font-medium text-gray-900 mb-2">What happens next:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• 🎙️ Audio transcription (~2-5 minutes)</li>
                <li>• 🤖 AI analysis and summarization</li>
                <li>• 📋 Action items extraction</li>
                <li>• 📤 Export and sharing options</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}