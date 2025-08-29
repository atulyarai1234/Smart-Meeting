'use client';
import { useState } from 'react';

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('Demo meeting');
  const [loading, setLoading] = useState(false);
  const [meetingId, setMeetingId] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    const form = new FormData();
    form.set('file', file);
    form.set('title', title);
    const res = await fetch('/api/upload', { method: 'POST', body: form });
    const json = await res.json();
    if (res.ok) setMeetingId(json.meetingId);
    else alert(json.error || 'Upload failed');
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Upload a recording</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <input className="w-full rounded border p-2" value={title} onChange={e=>setTitle(e.target.value)} />
        <input className="w-full" type="file" accept="audio/*,video/*" onChange={e=>setFile(e.target.files?.[0] ?? null)} />
        <button disabled={!file || loading} className="rounded bg-black px-4 py-2 text-white disabled:opacity-50">
          {loading ? 'Uploading…' : 'Upload'}
        </button>
      </form>
      {meetingId && (
        <p className="text-sm">
          Uploaded. Go to meeting: <a className="underline" href={`/m/${meetingId}`}>{meetingId}</a>
        </p>
      )}
    </div>
  );
}
