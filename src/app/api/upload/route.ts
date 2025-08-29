import { NextRequest, NextResponse } from 'next/server';
import { createMeeting } from '@/lib/db';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const title = (formData.get('title') as string) || 'Untitled meeting';
  const file = formData.get('file') as File | null;
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 });

  // Create meeting
  const meeting = await createMeeting(title);

  // Upload to Storage bucket `recordings`
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const ext = (file.name.split('.').pop() || 'dat').toLowerCase();
  const path = `${meeting.id}.${ext}`;

  const { error: uploadErr } = await supabaseAdmin.storage
    .from('recordings')
    .upload(path, buffer, { contentType: file.type || 'application/octet-stream', upsert: true });

  if (uploadErr) return NextResponse.json({ error: uploadErr.message }, { status: 500 });

  return NextResponse.json({ meetingId: meeting.id });
}
