'use client';

import { useState } from 'react';
import Link from 'next/link';
import { formatTime, formatRelativeTime } from '@/lib/utils';
import type { MeetingWithCounts } from '@/types';

interface MeetingListProps {
  meetings: MeetingWithCounts[];
  onSearch: (query: string) => void;
  onFilter: (status: string) => void;
  searchQuery: string;
  statusFilter: string;
}

export function MeetingList({ 
  meetings, 
  onSearch, 
  onFilter, 
  searchQuery, 
  statusFilter 
}: MeetingListProps) {
  const [localSearch, setLocalSearch] = useState(searchQuery);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(localSearch);
  };

  const statusOptions = [
    { value: 'all', label: 'All Status', count: meetings.length },
    { value: 'created', label: 'Ready to Process', count: meetings.filter(m => m.status === 'created').length },
    { value: 'processing', label: 'Processing', count: meetings.filter(m => m.status === 'processing').length },
    { value: 'transcribed', label: 'Transcribed', count: meetings.filter(m => m.status === 'transcribed').length },
    { value: 'summarized', label: 'Summarized', count: meetings.filter(m => m.status === 'summarized').length },
    { value: 'error', label: 'Errors', count: meetings.filter(m => m.status === 'error').length }
  ];

  function StatusBadge({ status }: { status: string }) {
    const statusConfig = {
      created: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Ready' },
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

  function QuickActions({ meeting }: { meeting: MeetingWithCounts }) {
    if (meeting.status === 'created') {
      return (
        <Link
          href={`/m/${meeting.id}`}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
        >
          🎙️ Transcribe
        </Link>
      );
    }

    if (meeting.status === 'transcribed') {
      return (
        <Link
          href={`/m/${meeting.id}`}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          🤖 Summarize
        </Link>
      );
    }

    if (meeting.status === 'summarized') {
      return (
        <Link
          href={`/m/${meeting.id}`}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
        >
          📤 Export
        </Link>
      );
    }

    return (
      <Link
        href={`/m/${meeting.id}`}
        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
      >
        👁️ View
      </Link>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filter Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">All Meetings</h2>
            <p className="text-sm text-gray-600 mt-1">
              {meetings.length} meeting{meetings.length !== 1 ? 's' : ''} found
            </p>
          </div>
          
          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="flex gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <input
                type="text"
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                placeholder="Search meetings..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg font-medium transition-colors"
            >
              Search
            </button>
          </form>
        </div>

        {/* Status Filter */}
        <div className="mt-4 flex flex-wrap gap-2">
          {statusOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => onFilter(option.value)}
              disabled={option.count === 0}
              className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                statusFilter === option.value
                  ? 'bg-blue-600 text-white'
                  : option.count === 0
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              {option.label} {option.count > 0 && `(${option.count})`}
            </button>
          ))}
        </div>

        {/* Active filters display */}
        {(searchQuery || statusFilter !== 'all') && (
          <div className="mt-4 flex items-center gap-2 text-sm">
            <span className="text-gray-600">Active filters:</span>
            {searchQuery && (
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                Search: "{searchQuery}"
                <button
                  onClick={() => onSearch('')}
                  className="ml-2 text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </span>
            )}
            {statusFilter !== 'all' && (
              <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">
                Status: {statusOptions.find(s => s.value === statusFilter)?.label}
                <button
                  onClick={() => onFilter('all')}
                  className="ml-2 text-purple-600 hover:text-purple-800"
                >
                  ×
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Meeting List */}
      {meetings.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <div className="text-gray-400 text-6xl mb-4">📊</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No meetings found</h3>
          <p className="text-gray-600 mb-6">
            {searchQuery || statusFilter !== 'all' 
              ? 'Try adjusting your search or filter criteria.'
              : 'Get started by uploading your first meeting recording.'
            }
          </p>
          {!searchQuery && statusFilter === 'all' && (
            <Link
              href="/upload"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              📤 Upload First Meeting
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-200">
          {meetings.map((meeting) => (
            <div key={meeting.id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  {/* Meeting Title */}
                  <div className="flex items-center gap-3 mb-2">
                    <Link
                      href={`/m/${meeting.id}`}
                      className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors truncate"
                    >
                      {meeting.title}
                    </Link>
                    <StatusBadge status={meeting.status} />
                  </div>

                  {/* Meeting Meta */}
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                    <span>📅 {formatRelativeTime(meeting.created_at)}</span>
                    {meeting.duration && (
                      <span>⏱️ {formatTime(meeting.duration)}</span>
                    )}
                    {meeting.transcript_count && meeting.transcript_count > 0 && (
                      <span>📝 {meeting.transcript_count} segments</span>
                    )}
                    {meeting.action_items_count && meeting.action_items_count > 0 && (
                      <span>📋 {meeting.action_items_count} action items</span>
                    )}
                  </div>

                  {/* Quick Stats */}
                  <div className="flex items-center gap-3">
                    {meeting.has_summary && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                        ✅ AI Summary
                      </span>
                    )}
                    {meeting.transcript_count && meeting.transcript_count > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                        🎙️ Transcribed
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 ml-4">
                  <QuickActions meeting={meeting} />
                  <Link
                    href={`/m/${meeting.id}`}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                    title="View meeting"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}