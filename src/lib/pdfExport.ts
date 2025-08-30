import jsPDF from 'jspdf';
import type { ExportData } from './exportUtils';

export async function exportToPDF(data: ExportData, filename: string): Promise<void> {
  const { meeting, summary, actionItems, transcript } = data;

  // Create PDF document
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const lineHeight = 7;
  let yPosition = margin;

  // Helper function to add text with word wrapping
  const addText = (text: string, fontSize = 10, isBold = false, isTitle = false) => {
    if (isTitle) {
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
    } else if (isBold) {
      pdf.setFontSize(fontSize);
      pdf.setFont('helvetica', 'bold');
    } else {
      pdf.setFontSize(fontSize);
      pdf.setFont('helvetica', 'normal');
    }

    const maxWidth = pageWidth - (margin * 2);
    const lines = pdf.splitTextToSize(text, maxWidth);
    
    // Check if we need a new page
    if (yPosition + (lines.length * lineHeight) > pageHeight - margin) {
      pdf.addPage();
      yPosition = margin;
    }

    pdf.text(lines, margin, yPosition);
    yPosition += lines.length * lineHeight + (isTitle ? 10 : 5);
  };

  // Add header line
  const addDivider = () => {
    if (yPosition > pageHeight - margin - 20) {
      pdf.addPage();
      yPosition = margin;
    }
    pdf.setDrawColor(200, 200, 200);
    pdf.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;
  };

  // Title
  addText(meeting.title, 18, true, true);
  
  // Meeting metadata
  addText(`Status: ${meeting.status.charAt(0).toUpperCase() + meeting.status.slice(1)}`, 10, true);
  addText(`Created: ${new Date(meeting.created_at).toLocaleDateString()}`, 10);
  
  if (transcript.length > 0) {
    const duration = Math.max(...transcript.map(s => s.end_s));
    const durationText = `${Math.floor(duration / 60)}:${(duration % 60).toFixed(0).padStart(2, '0')}`;
    addText(`Duration: ${durationText}`, 10);
  }

  addDivider();

  // AI Summary Section
  if (summary) {
    addText('🤖 AI Summary', 16, true);
    yPosition += 5;

    // TL;DR
    if (summary.tl_dr) {
      addText('Key Takeaway', 12, true);
      addText(summary.tl_dr, 10);
      yPosition += 5;
    }

    // Decisions
    if (summary.decisions && summary.decisions.length > 0) {
      addText('Decisions Made', 12, true);
      summary.decisions.forEach((decision, index) => {
        addText(`${index + 1}. ${decision.decision}`, 10, true);
        addText(`   Context: ${decision.context}`, 9);
        addText(`   Confidence: ${Math.round(decision.confidence * 100)}%`, 9);
        yPosition += 3;
      });
      yPosition += 5;
    }

    // Risks
    if (summary.risks && summary.risks.length > 0) {
      addText('Risks Identified', 12, true);
      summary.risks.forEach((risk, index) => {
        addText(`${index + 1}. ${risk.risk}`, 10, true);
        addText(`   Impact: ${risk.impact} | Likelihood: ${risk.likelihood}`, 9);
        yPosition += 3;
      });
      yPosition += 5;
    }

    // Questions
    if (summary.questions && summary.questions.length > 0) {
      addText('Open Questions', 12, true);
      summary.questions.forEach((question, index) => {
        addText(`${index + 1}. ${question.question}`, 10, true);
        addText(`   Category: ${question.category} | Urgency: ${question.urgency}`, 9);
        yPosition += 3;
      });
      yPosition += 5;
    }

    addDivider();
  }

  // Action Items
  if (actionItems.length > 0) {
    addText(`📋 Action Items (${actionItems.length})`, 16, true);
    yPosition += 5;

    actionItems.forEach((item, index) => {
      addText(`${index + 1}. ${item.title}`, 10, true);
      addText(`   Assignee: ${item.assignee || 'Unassigned'}`, 9);
      addText(`   Due Date: ${item.due_date ? new Date(item.due_date).toLocaleDateString() : 'No date set'}`, 9);
      addText(`   Priority: ${item.priority}`, 9);
      
      if (item.source_quote) {
        addText(`   Source: "${item.source_quote}"`, 9);
      }
      yPosition += 5;
    });

    addDivider();
  }

  // Transcript (first page only to avoid huge PDFs)
  if (transcript.length > 0) {
    addText('📝 Transcript Preview (First 10 segments)', 16, true);
    yPosition += 5;

    const previewTranscript = transcript.slice(0, 10); // Limit to first 10 segments
    
    previewTranscript.forEach(segment => {
      const timestamp = `[${Math.floor(segment.start_s / 60)}:${(segment.start_s % 60).toFixed(0).padStart(2, '0')}]`;
      addText(`${timestamp} ${segment.text}`, 9);
      yPosition += 2;
    });

    if (transcript.length > 10) {
      yPosition += 5;
      addText(`... and ${transcript.length - 10} more segments. Download full transcript separately.`, 9);
    }
  }

  // Footer
  const pageCount = pdf.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setTextColor(150);
    pdf.text(
      `Generated by Smart Meeting Hub - ${new Date().toLocaleDateString()} - Page ${i} of ${pageCount}`,
      margin,
      pageHeight - 10
    );
  }

  // Save the PDF
  pdf.save(filename);
}