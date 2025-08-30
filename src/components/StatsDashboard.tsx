interface MeetingStats {
    total: number;
    created: number;
    processing: number;
    transcribed: number;
    summarized: number;
    error: number;
    totalSegments: number;
    totalActionItems: number;
  }
  
  interface StatsDashboardProps {
    stats: MeetingStats;
  }
  
  export function StatsDashboard({ stats }: StatsDashboardProps) {
    const statCards = [
      {
        title: 'Total Meetings',
        value: stats.total,
        icon: '📊',
        color: 'bg-blue-50 text-blue-600 border-blue-200'
      },
      {
        title: 'Summarized',
        value: stats.summarized,
        icon: '🤖',
        color: 'bg-purple-50 text-purple-600 border-purple-200'
      },
      {
        title: 'Action Items',
        value: stats.totalActionItems,
        icon: '📋',
        color: 'bg-green-50 text-green-600 border-green-200'
      },
      {
        title: 'Transcript Segments',
        value: stats.totalSegments,
        icon: '📝',
        color: 'bg-orange-50 text-orange-600 border-orange-200'
      }
    ];
  
    const statusBreakdown = [
      { label: 'Ready to Process', count: stats.created, color: 'bg-gray-100' },
      { label: 'Processing', count: stats.processing, color: 'bg-blue-100' },
      { label: 'Transcribed', count: stats.transcribed, color: 'bg-green-100' },
      { label: 'Summarized', count: stats.summarized, color: 'bg-purple-100' },
      { label: 'Errors', count: stats.error, color: 'bg-red-100' }
    ].filter(status => status.count > 0);
  
    return (
      <div className="space-y-6">
        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat) => (
            <div
              key={stat.title}
              className={`border rounded-lg p-6 ${stat.color}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium opacity-75">{stat.title}</p>
                  <p className="text-3xl font-bold">{stat.value.toLocaleString()}</p>
                </div>
                <div className="text-3xl">{stat.icon}</div>
              </div>
            </div>
          ))}
        </div>
  
        {/* Status Breakdown */}
        {stats.total > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Meeting Status</h3>
            <div className="space-y-3">
              {statusBreakdown.map((status) => {
                const percentage = stats.total > 0 ? (status.count / stats.total) * 100 : 0;
                return (
                  <div key={status.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full ${status.color}`}></div>
                      <span className="text-sm font-medium text-gray-700">{status.label}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${status.color.replace('100', '400')}`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-600 w-12 text-right">
                        {status.count}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
  
        {/* Quick Insights */}
        {stats.total > 0 && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">📈 Quick Insights</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-blue-600">•</span>
                <span>
                  <strong>{Math.round((stats.summarized / Math.max(stats.total, 1)) * 100)}%</strong> of meetings fully processed
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-600">•</span>
                <span>
                  <strong>{(stats.totalActionItems / Math.max(stats.summarized, 1)).toFixed(1)}</strong> action items per summarized meeting
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-orange-600">•</span>
                <span>
                  <strong>{(stats.totalSegments / Math.max(stats.total - stats.created, 1)).toFixed(0)}</strong> transcript segments per processed meeting
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-purple-600">•</span>
                <span>
                  {stats.processing > 0 
                    ? `${stats.processing} meeting${stats.processing > 1 ? 's' : ''} currently processing`
                    : 'All meetings processed successfully'
                  }
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }