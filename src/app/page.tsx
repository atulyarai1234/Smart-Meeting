import Link from 'next/link';
import { StatsDashboard } from '@/components/StatsDashboard';
import { MeetingListContainer } from '@/components/MeetingListContainer';
import { getAllMeetings, getMeetingStats } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  try {
    // Load initial data server-side
    const [initialMeetings, stats] = await Promise.all([
      getAllMeetings(50, 0),
      getMeetingStats()
    ]);

    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Smart Meeting Hub</h1>
                <p className="text-gray-600 mt-1">
                  AI-powered meeting transcription, summarization, and insights
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                <Link
                  href="/upload"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  📤 Upload Recording
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="space-y-8">
            {/* Stats Dashboard */}
            <StatsDashboard stats={stats} />

            {/* Quick Actions for First-time Users */}
            {stats.total === 0 && (
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg text-white p-8">
                <div className="max-w-3xl">
                  <h2 className="text-2xl font-bold mb-4">Welcome to Smart Meeting Hub! 🚀</h2>
                  <p className="text-blue-100 mb-6 text-lg">
                    Transform your meeting recordings into actionable insights with AI-powered transcription and summarization.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white bg-opacity-10 rounded-lg p-4">
                      <div className="text-2xl mb-2">🎙️</div>
                      <h3 className="font-semibold mb-2">Upload & Transcribe</h3>
                      <p className="text-blue-100 text-sm">Upload audio/video files and get accurate transcriptions in minutes.</p>
                    </div>
                    <div className="bg-white bg-opacity-10 rounded-lg p-4">
                      <div className="text-2xl mb-2">🤖</div>
                      <h3 className="font-semibold mb-2">AI Summarization</h3>
                      <p className="text-blue-100 text-sm">Extract key decisions, risks, questions, and action items automatically.</p>
                    </div>
                    <div className="bg-white bg-opacity-10 rounded-lg p-4">
                      <div className="text-2xl mb-2">📤</div>
                      <h3 className="font-semibold mb-2">Export & Share</h3>
                      <p className="text-blue-100 text-sm">Download as PDF/Word or create shareable links for your team.</p>
                    </div>
                  </div>

                  <Link
                    href="/upload"
                    className="inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors text-lg"
                  >
                    🚀 Get Started - Upload Your First Meeting
                  </Link>
                </div>
              </div>
            )}

            {/* Quick Actions for Returning Users */}
            {stats.total > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">⚡ Quick Actions</h2>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Need help?</span>
                    <Link 
                      href="/upload" 
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Upload Guide →
                    </Link>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Link
                    href="/upload"
                    className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors group"
                  >
                    <div className="text-2xl group-hover:scale-110 transition-transform">📤</div>
                    <div>
                      <h3 className="font-medium text-gray-900">Upload New</h3>
                      <p className="text-sm text-gray-600">Add meeting recording</p>
                    </div>
                  </Link>

                  {stats.created > 0 && (
                    <div className="flex items-center gap-3 p-4 border border-orange-200 rounded-lg bg-orange-50">
                      <div className="text-2xl">🎙️</div>
                      <div>
                        <h3 className="font-medium text-gray-900">{stats.created} Ready</h3>
                        <p className="text-sm text-gray-600">To transcribe</p>
                      </div>
                    </div>
                  )}

                  {stats.transcribed > 0 && (
                    <div className="flex items-center gap-3 p-4 border border-blue-200 rounded-lg bg-blue-50">
                      <div className="text-2xl">🤖</div>
                      <div>
                        <h3 className="font-medium text-gray-900">{stats.transcribed} Ready</h3>
                        <p className="text-sm text-gray-600">To summarize</p>
                      </div>
                    </div>
                  )}

                  {stats.summarized > 0 && (
                    <div className="flex items-center gap-3 p-4 border border-green-200 rounded-lg bg-green-50">
                      <div className="text-2xl">📊</div>
                      <div>
                        <h3 className="font-medium text-gray-900">{stats.summarized} Complete</h3>
                        <p className="text-sm text-gray-600">Ready to export</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Meeting List */}
            {stats.total > 0 && (
              <MeetingListContainer initialMeetings={initialMeetings} />
            )}
          </div>
        </div>
      </div>
    );

  } catch (error) {
    console.error('Homepage error:', error);
    
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h1>
          <p className="text-gray-600 mb-6">Unable to load your meetings. Please try again.</p>
          <Link
            href="/"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Refresh Page
          </Link>
        </div>
      </div>
    );
  }
}