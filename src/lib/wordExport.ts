import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle } from 'docx';
import { saveAs } from 'file-saver';
import type { ExportData } from './exportUtils';

export async function exportToWord(data: ExportData, filename: string): Promise<void> {
  const { meeting, summary, actionItems, transcript } = data;

  // Create document sections
  const children: Paragraph[] = [];

  // Title
  children.push(
    new Paragraph({
      children: [new TextRun({ text: meeting.title, bold: true, size: 32 })],
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 }
    })
  );

  // Meeting Info
  const duration = transcript.length > 0 ? Math.max(...transcript.map(s => s.end_s)) : 0;
  const durationText = `${Math.floor(duration / 60)}:${(duration % 60).toFixed(0).padStart(2, '0')}`;
  
  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: 'Status: ', bold: true }),
        new TextRun({ text: meeting.status.charAt(0).toUpperCase() + meeting.status.slice(1) })
      ],
      spacing: { after: 100 }
    }),
    new Paragraph({
      children: [
        new TextRun({ text: 'Created: ', bold: true }),
        new TextRun({ text: new Date(meeting.created_at).toLocaleDateString() })
      ],
      spacing: { after: 100 }
    })
  );

  if (duration > 0) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: 'Duration: ', bold: true }),
          new TextRun({ text: durationText })
        ],
        spacing: { after: 400 }
      })
    );
  }

  // AI Summary Section
  if (summary) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: '🤖 AI Summary', bold: true, size: 28 })],
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 }
      })
    );

    // TL;DR
    if (summary.tl_dr) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: 'Key Takeaway', bold: true, size: 24 })],
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300, after: 100 }
        }),
        new Paragraph({
          children: [new TextRun({ text: summary.tl_dr })],
          spacing: { after: 200 }
        })
      );
    }

    // Decisions
    if (summary.decisions && summary.decisions.length > 0) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: 'Decisions Made', bold: true, size: 24 })],
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300, after: 100 }
        })
      );

      summary.decisions.forEach((decision, index) => {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: `${index + 1}. `, bold: true }),
              new TextRun({ text: decision.decision, bold: true })
            ],
            spacing: { after: 50 }
          }),
          new Paragraph({
            children: [
              new TextRun({ text: '   Context: ' }),
              new TextRun({ text: decision.context })
            ],
            spacing: { after: 50 }
          }),
          new Paragraph({
            children: [
              new TextRun({ text: '   Confidence: ' }),
              new TextRun({ text: `${Math.round(decision.confidence * 100)}%` })
            ],
            spacing: { after: 150 }
          })
        );
      });
    }

    // Risks
    if (summary.risks && summary.risks.length > 0) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: 'Risks Identified', bold: true, size: 24 })],
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300, after: 100 }
        })
      );

      summary.risks.forEach((risk, index) => {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: `${index + 1}. `, bold: true }),
              new TextRun({ text: risk.risk, bold: true })
            ],
            spacing: { after: 50 }
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `   Impact: ${risk.impact} | Likelihood: ${risk.likelihood}` })
            ],
            spacing: { after: 150 }
          })
        );
      });
    }

    // Questions
    if (summary.questions && summary.questions.length > 0) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: 'Open Questions', bold: true, size: 24 })],
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300, after: 100 }
        })
      );

      summary.questions.forEach((question, index) => {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: `${index + 1}. `, bold: true }),
              new TextRun({ text: question.question, bold: true })
            ],
            spacing: { after: 50 }
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `   Category: ${question.category} | Urgency: ${question.urgency}` })
            ],
            spacing: { after: 150 }
          })
        );
      });
    }
  }

  // Action Items
  if (actionItems.length > 0) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: `📋 Action Items (${actionItems.length})`, bold: true, size: 28 })],
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 }
      })
    );

    actionItems.forEach((item, index) => {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${index + 1}. `, bold: true }),
            new TextRun({ text: item.title, bold: true })
          ],
          spacing: { after: 50 }
        }),
        new Paragraph({
          children: [
            new TextRun({ text: '   Assignee: ' }),
            new TextRun({ text: item.assignee || 'Unassigned' })
          ],
          spacing: { after: 50 }
        }),
        new Paragraph({
          children: [
            new TextRun({ text: '   Due Date: ' }),
            new TextRun({ text: item.due_date ? new Date(item.due_date).toLocaleDateString() : 'No date set' })
          ],
          spacing: { after: 50 }
        }),
        new Paragraph({
          children: [
            new TextRun({ text: '   Priority: ' }),
            new TextRun({ text: item.priority })
          ],
          spacing: { after: item.source_quote ? 50 : 150 }
        })
      );

      if (item.source_quote) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: '   Source: "' }),
              new TextRun({ text: item.source_quote, italics: true }),
              new TextRun({ text: '"' })
            ],
            spacing: { after: 150 }
          })
        );
      }
    });
  }

  // Transcript
  if (transcript.length > 0) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: '📝 Full Transcript', bold: true, size: 28 })],
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 }
      })
    );

    transcript.forEach(segment => {
      const timestamp = `[${Math.floor(segment.start_s / 60)}:${(segment.start_s % 60).toFixed(0).padStart(2, '0')}]`;
      
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: timestamp, bold: true }),
            new TextRun({ text: ` ${segment.text}` })
          ],
          spacing: { after: 100 }
        })
      );
    });
  }

  // Create document
  const doc = new Document({
    sections: [{
      properties: {},
      children: children
    }]
  });

  // Generate and download
  const buffer = await Packer.toBlob(doc);
  saveAs(buffer, filename);
}