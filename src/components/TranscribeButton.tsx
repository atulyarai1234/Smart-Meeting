'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface TranscribeButtonProps {
  meetingId: string;
}

export function TranscribeButton({ meetingId }: TranscribeButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function startTranscription() {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/process/transcribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ meetingId }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to start transcription');
      }

      console.log('Transcription started:', result);
      
      // Refresh the page to show updated status
      router.refresh();
      
      // Optionally poll for completion or use websockets for real-time updates
      pollForCompletion();
      
    } catch (err) {
      console.error('Transcription error:', err);
      setError(err instanceof Error ? err.message : 'Failed to start transcription');
    } finally {
      setLoading(false);
    }
  }

  // Simple polling to check if transcription is complete
  async function pollForCompletion() {
    const maxPolls = 30; // 5 minutes max (30 * 10s)
    let polls = 0;
    
    const poll = async () => {
      if (polls >= maxPolls) return;
      
      try {
        const response = await fetch(`/api/meetings/${meetingId}/status`);
        if (response.ok) {
          const { status } = await response.json();
          
          if (status === 'transcribed' || status === 'error') {
            router.refresh();
            return;
          }
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
      
      polls++;
      setTimeout(poll, 10000); // Poll every 10 seconds
    };
    
    // Start polling after a short delay
    setTimeout(poll, 5000);
  }

  if (loading) {
    return (
      <div className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-3">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
        Starting transcription...
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <button
        onClick={startTranscription}
        disabled={loading}
        className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-6 py-3 rounded-lg font-medium transition-colors"
      >
        Start Transcription
      </button>
      
      {error && (
        <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded p-3">
          Error: {error}
        </div>
      )}
    </div>
  );
}