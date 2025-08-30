'use client';

import { useState } from 'react';
import { 
  formatMeetingForExport, 
  copyToClipboard, 
  downloadTextFile, 
  generateFilename 
} from '@/lib/exportUtils';
import { exportToWord } from '@/lib/wordExport';
import type { ExportData } from '@/lib/exportUtils';
import { exportToPDF } from '@/lib/pdfExport';

interface ExportButtonsProps {
  data: ExportData;
}

export function ExportButtons({ data }: ExportButtonsProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const showMessage = (text: string, type: 'success' | 'error' = 'success') => {
    setMessage(text);
    setTimeout(() => setMessage(null), 3000);
  };

  // Copy summary to clipboard
  async function handleCopyToClipboard() {
    setLoading('clipboard');
    try {
      const content = formatMeetingForExport(data);
      const success = await copyToClipboard(content);
      
      if (success) {
        showMessage('✅ Copied to clipboard!');
      } else {
        showMessage('❌ Failed to copy to clipboard', 'error');
      }
    } catch (error) {
      console.error('Copy error:', error);
      showMessage('❌ Failed to copy to clipboard', 'error');
    } finally {
      setLoading(null);
    }
  }

  // Export as text file
  function handleExportText() {
    setLoading('text');
    try {
      const content = formatMeetingForExport(data);
      const filename = generateFilename(data.meeting.title, 'txt');
      downloadTextFile(content, filename, 'text/plain');
      showMessage('✅ Text file downloaded!');
    } catch (error) {
      console.error('Text export error:', error);
      showMessage('❌ Failed to export text file', 'error');
    } finally {
      setLoading(null);
    }
  }

  // Export as Word document
  async function handleExportWord() {
    setLoading('word');
    try {
      const filename = generateFilename(data.meeting.title, 'docx');
      await exportToWord(data, filename);
      showMessage('✅ Word document downloaded!');
    } catch (error) {
      console.error('Word export error:', error);
      showMessage('❌ Failed to export Word document', 'error');
    } finally {
      setLoading(null);
    }
  }

  // Generate share link
  async function handleGenerateShareLink() {
    setLoading('share');
    try {
      const response = await fetch('/api/share/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          meetingId: data.meeting.id,
          expiresInDays: 30,
          includeTranscript: true
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate share link');
      }

      const { shareUrl } = await response.json();
      
      // Copy share URL to clipboard
      const success = await copyToClipboard(shareUrl);
      
      if (success) {
        showMessage('🔗 Share link copied to clipboard!');
      } else {
        showMessage(`Share link: ${shareUrl}`, 'success');
      }
      
    } catch (error) {
      console.error('Share link error:', error);
      showMessage('❌ Failed to generate share link', 'error');
    } finally {
      setLoading(null);
    }
  }

  // Export as PDF (we'll implement this next)
  async function handleExportPDF() {
    setLoading('pdf');
    try {
      const filename = generateFilename(data.meeting.title, 'pdf');
      await exportToPDF(data, filename);
      showMessage('✅ PDF document downloaded!');
    } catch (error) {
      console.error('PDF export error:', error);
      showMessage('❌ Failed to export PDF', 'error');
    } finally {
      setLoading(null);
    }
  }

  const buttonClass = "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50";
  const primaryButtonClass = `${buttonClass} bg-blue-600 hover:bg-blue-700 text-white`;
  const secondaryButtonClass = `${buttonClass} bg-gray-100 hover:bg-gray-200 text-gray-700`;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h3 className="text-lg font-medium text-gray-900">Export & Share</h3>
        {message && (
          <span className={`text-sm px-3 py-1 rounded-full ${
            message.includes('❌') 
              ? 'bg-red-100 text-red-700' 
              : 'bg-green-100 text-green-700'
          }`}>
            {message}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {/* Copy to Clipboard */}
        <button
          onClick={handleCopyToClipboard}
          disabled={loading === 'clipboard'}
          className={secondaryButtonClass}
        >
          {loading === 'clipboard' ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          )}
          Copy Summary
        </button>

        {/* Export Text */}
        <button
          onClick={handleExportText}
          disabled={loading === 'text'}
          className={secondaryButtonClass}
        >
          {loading === 'text' ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          )}
          Download Text
        </button>

        {/* Export Word Document */}
        <button
          onClick={handleExportWord}
          disabled={loading === 'word'}
          className={secondaryButtonClass}
        >
          {loading === 'word' ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          )}
          Download Word
        </button>

        {/* Generate Share Link */}
        <button
          onClick={handleGenerateShareLink}
          disabled={loading === 'share'}
          className={primaryButtonClass}
        >
          {loading === 'share' ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
            </svg>
          )}
          Share Link
        </button>

        {/* Export PDF */}
        <button
          onClick={handleExportPDF}
          disabled={loading === 'pdf'}
          className={primaryButtonClass}
        >
          {loading === 'pdf' ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          )}
          Export PDF
        </button>

        {/* Email Share */}
        <button
          onClick={() => showMessage('📧 Email sharing coming next!')}
          className={secondaryButtonClass}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          Email Summary
        </button>
      </div>

      {/* Quick actions info */}
      <div className="text-sm text-gray-500 bg-gray-50 rounded-lg p-3">
        <p><strong>Quick tip:</strong> Use "Copy Summary" to paste into Slack, emails, or documents. Download files for offline access or further editing.</p>
      </div>
    </div>
  );
}