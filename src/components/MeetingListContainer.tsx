'use client';

import { useState, useEffect } from 'react';
import { MeetingList } from './MeetingList';
import type { MeetingWithCounts } from '@/types';

interface MeetingListContainerProps {
  initialMeetings: MeetingWithCounts[];
}

export function MeetingListContainer({ initialMeetings }: MeetingListContainerProps) {
  const [meetings, setMeetings] = useState<MeetingWithCounts[]>(initialMeetings);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(false);

  // Reload meetings when search or filter changes
  useEffect(() => {
    if (searchQuery || statusFilter !== 'all') {
      loadMeetingsFromAPI();
    } else {
      // Reset to initial meetings when no filters
      setMeetings(initialMeetings);
    }
  }, [searchQuery, statusFilter, initialMeetings]);

  async function loadMeetingsFromAPI() {
    try {
      setLoading(true);
      
      const params = new URLSearchParams();
      if (searchQuery) params.set('search', searchQuery);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      params.set('limit', '50');
      
      const response = await fetch(`/api/meetings?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch meetings');
      }
      
      const data = await response.json();
      setMeetings(data.meetings);
    } catch (err) {
      console.error('Failed to load meetings:', err);
      // Keep current meetings on error
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(query: string) {
    setSearchQuery(query);
  }

  function handleFilter(status: string) {
    setStatusFilter(status);
  }

  return (
    <div className="relative">
      {loading && (
        <div className="absolute top-0 left-0 right-0 bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 z-10">
          <div className="flex items-center gap-2 text-blue-800">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-sm font-medium">Updating meeting list...</span>
          </div>
        </div>
      )}
      
      <div className={loading ? 'opacity-50 pointer-events-none' : ''}>
        <MeetingList
          meetings={meetings}
          onSearch={handleSearch}
          onFilter={handleFilter}
          searchQuery={searchQuery}
          statusFilter={statusFilter}
        />
      </div>
    </div>
  );
}