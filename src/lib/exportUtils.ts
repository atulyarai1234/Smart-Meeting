import type { Meeting, Summary, ActionItem, TranscriptSegment } from '../types';

export interface ExportData {
  meeting: Meeting;
  summary: Summary | null;
  actionItems: ActionItem[];
  transcript: TranscriptSegment[];
}

// Format meeting data for export
export function formatMeetingForExport(data: ExportData): string {
  const { meeting, summary, actionItems, transcript } = data;
  
  let content = '';
  
  // Header
  content += `# ${meeting.title}\n\n`;
  content += `**Status:** ${meeting.status.charAt(0).toUpperCase() + meeting.status.slice(1)}\n`;
  content += `**Created:** ${new Date(meeting.created_at).toLocaleDateString()}\n`;
  if (transcript.length > 0) {
    const duration = Math.max(...transcript.map(s => s.end_s));
    content += `**Duration:** ${Math.floor(duration / 60)}:${(duration % 60).toFixed(0).padStart(2, '0')}\n`;
  }
  content += `\n---\n\n`;

  // AI Summary
  if (summary) {
    content += `## 🤖 AI Summary\n\n`;
    
    if (summary.tl_dr) {
      content += `### Key Takeaway\n${summary.tl_dr}\n\n`;
    }

    if (summary.decisions && summary.decisions.length > 0) {
      content += `### Decisions Made\n`;
      summary.decisions.forEach((decision, index) => {
        content += `${index + 1}. **${decision.decision}**\n`;
        content += `   - Context: ${decision.context}\n`;
        content += `   - Confidence: ${Math.round(decision.confidence * 100)}%\n\n`;
      });
    }

    if (summary.risks && summary.risks.length > 0) {
      content += `### Risks Identified\n`;
      summary.risks.forEach((risk, index) => {
        content += `${index + 1}. **${risk.risk}**\n`;
        content += `   - Impact: ${risk.impact}\n`;
        content += `   - Likelihood: ${risk.likelihood}\n\n`;
      });
    }

    if (summary.questions && summary.questions.length > 0) {
      content += `### Open Questions\n`;
      summary.questions.forEach((question, index) => {
        content += `${index + 1}. **${question.question}**\n`;
        content += `   - Category: ${question.category}\n`;
        content += `   - Urgency: ${question.urgency}\n\n`;
      });
    }
  }

  // Action Items
  if (actionItems.length > 0) {
    content += `## 📋 Action Items (${actionItems.length})\n\n`;
    actionItems.forEach((item, index) => {
      content += `${index + 1}. **${item.title}**\n`;
      content += `   - Assignee: ${item.assignee || 'Unassigned'}\n`;
      content += `   - Due Date: ${item.due_date ? new Date(item.due_date).toLocaleDateString() : 'No date set'}\n`;
      content += `   - Priority: ${item.priority}\n`;
      if (item.source_quote) {
        content += `   - Source: "${item.source_quote}"\n`;
      }
      content += `\n`;
    });
  }

  // Transcript
  if (transcript.length > 0) {
    content += `## 📝 Full Transcript\n\n`;
    transcript.forEach(segment => {
      const timestamp = `[${Math.floor(segment.start_s / 60)}:${(segment.start_s % 60).toFixed(0).padStart(2, '0')}]`;
      content += `**${timestamp}** ${segment.text}\n\n`;
    });
  }

  return content;
}

// Copy text to clipboard
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    // Fallback for older browsers
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return true;
    } catch (fallbackErr) {
      console.error('Failed to copy to clipboard:', fallbackErr);
      return false;
    }
  }
}

// Download text as file
export function downloadTextFile(content: string, filename: string, mimeType = 'text/plain'): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Generate filename with timestamp
export function generateFilename(meetingTitle: string, extension: string): string {
  const cleanTitle = meetingTitle
    .replace(/[^a-zA-Z0-9\s]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .toLowerCase();
  
  const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  return `meeting-${cleanTitle}-${timestamp}.${extension}`;
}

// Convert markdown to basic HTML for PDF generation
export function markdownToHtml(markdown: string): string {
  return markdown
    // Headers
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Horizontal rule
    .replace(/^---$/gm, '<hr>')
    // Line breaks
    .replace(/\n/g, '<br>')
    // Lists (basic)
    .replace(/^(\d+)\. (.+)$/gm, '<li>$2</li>')
    .replace(/(<li>.*<\/li>)/s, '<ol>$1</ol>');
}