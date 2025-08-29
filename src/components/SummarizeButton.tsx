'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface SummarizeButtonProps {
  meetingId: string;
}

export function SummarizeButton({ meetingId }: SummarizeButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleClick() {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🤖 Starting summarization...');
      
      const response = await fetch('/api/process/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ meetingId }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate summary');
      }

      console.log('✅ Summarization completed:', result);
      
      // Refresh the page to show the summary
      router.refresh();
      
    } catch (err) {
      console.error('❌ Summarization error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate summary');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button 
        onClick={handleClick}
        disabled={loading}
        className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-3"
      >
        {loading && (
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
        )}
        {loading ? 'Analyzing transcript...' : '🤖 Generate Summary'}
      </button>
      
      {error && (
        <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded p-3">
          Error: {error}
        </div>
      )}
    </div>
  );
}