import { formatTime, formatDate } from '@/lib/utils';
import Link from 'next/link';
import type { Meeting, Summary, ActionItem, TranscriptSegment } from '@/types';

interface SharedMeetingData {
  meeting: Meeting;
  summary: Summary | null;
  actionItems: ActionItem[];
  transcript: TranscriptSegment[];
  shareSettings: {
    includeTranscript: boolean;
    expiresAt: string;
  };
}

async function getSharedMeeting(token: string): Promise<SharedMeetingData | null> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/shared/${token}`, {
      cache: 'no-store'
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch {
    return null;
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

function TranscriptSection({ transcript }: { transcript: TranscriptSegment[] }) {
  if (transcript.length === 0) return null;

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">📝 Full Transcript</h2>
      </div>
      
      <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
        {transcript.map(segment => (
          <div key={segment.id} className="flex gap-4 p-4 hover:bg-gray-50">
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
        ))}
      </div>
    </div>
  );
}

export default async function SharedMeetingPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const data = await getSharedMeeting(token);

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="text-red-600 text-6xl mb-4">🔗</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Link Not Found</h1>
          <p className="text-gray-600 mb-6">
            This shared meeting link is invalid or has expired.
          </p>
          <Link 
            href="/"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Go to Smart Meeting Hub
          </Link>
        </div>
      </div>
    );
  }

  const { meeting, summary, actionItems, transcript, shareSettings } = data;
  const totalDuration = transcript.length > 0 ? Math.max(...transcript.map(s => s.end_s)) : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{meeting.title}</h1>
              <p className="text-sm text-gray-500">Shared meeting summary</p>
            </div>
            <StatusBadge status={meeting.status} />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {/* Meeting info */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Created:</span>
              <p className="text-gray-900">{formatDate(meeting.created_at)}</p>
            </div>
            {totalDuration > 0 && (
              <div>
                <span className="font-medium text-gray-700">Duration:</span>
                <p className="text-gray-900">{formatTime(totalDuration)}</p>
              </div>
            )}
            <div>
              <span className="font-medium text-gray-700">Expires:</span>
              <p className="text-gray-900">{formatDate(shareSettings.expiresAt)}</p>
            </div>
          </div>
        </div>

        {/* Summary */}
        {summary && <SummarySection summary={summary} />}

        {/* Action Items */}
        <ActionItemsSection actionItems={actionItems} />

        {/* Transcript */}
        {shareSettings.includeTranscript && <TranscriptSection transcript={transcript} />}

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 py-8">
          <p>Generated by <Link href="/" className="text-blue-600 hover:underline">Smart Meeting Hub</Link></p>
          <p>Share link expires on {formatDate(shareSettings.expiresAt)}</p>
        </div>
      </div>
    </div>
  );
}