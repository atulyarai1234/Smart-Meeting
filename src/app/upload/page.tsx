'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navigation } from '@/components/Navigation';

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ meetingId: string } | null>(null);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    
    setLoading(true);
    try {
      const form = new FormData();
      form.set('file', file);
      form.set('title', title || 'Untitled Meeting');
      
      const res = await fetch('/api/upload', { method: 'POST', body: form });
      const json = await res.json();
      
      if (json.meetingId) {
        setResult(json);
        // Redirect to meeting page after a short delay
        setTimeout(() => {
          router.push(`/m/${json.meetingId}`);
        }, 2000);
      }
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation currentPage="upload" />
      
      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="bg-white rounded-lg border border-gray-200 p-8">
          <div className="text-center mb-8">
            <div className="text-4xl mb-4">🎙️</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Upload Meeting Recording</h1>
            <p className="text-gray-600">
              Upload your audio or video file to get started with AI transcription and summarization
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Meeting Title
              </label>
              <input
                id="title"
                type="text"
                placeholder="e.g., Team Standup - January 15"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="file" className="block text-sm font-medium text-gray-700 mb-2">
                Recording File
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
                <input
                  id="file"
                  type="file"
                  accept="audio/*,video/*"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="hidden"
                />
                <label htmlFor="file" className="cursor-pointer">
                  <div className="text-4xl mb-4">📁</div>
                  {file ? (
                    <div>
                      <p className="text-lg font-medium text-gray-900">{file.name}</p>
                      <p className="text-sm text-gray-600">
                        {(file.size / (1024 * 1024)).toFixed(1)} MB
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-lg font-medium text-gray-900 mb-2">
                        Click to select file
                      </p>
                      <p className="text-sm text-gray-600">
                        Supports MP3, MP4, WAV, M4A, and more
                      </p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            <button 
              type="submit"
              disabled={!file || loading}
              className="w-full px-6 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-semibold text-lg transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Uploading...
                </>
              ) : (
                <>
                  🚀 Upload & Process
                </>
              )}
            </button>
          </form>

          {result && (
            <div className="mt-8 p-6 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <div className="text-2xl">✅</div>
                <h3 className="text-lg font-semibold text-green-900">Upload Successful!</h3>
              </div>
              <p className="text-green-800 mb-4">
                Your meeting has been uploaded and is ready for processing.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => router.push(`/m/${result.meetingId}`)}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                >
                  View Meeting →
                </button>
                <button
                  onClick={() => {
                    setFile(null);
                    setTitle('');
                    setResult(null);
                  }}
                  className="px-4 py-2 bg-white border border-green-600 text-green-600 rounded-lg font-medium hover:bg-green-50 transition-colors"
                >
                  Upload Another
                </button>
              </div>
            </div>
          )}

          {/* Help section */}
          <div className="mt-8 p-6 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-3">💡 Tips for Best Results</h3>
            <ul className="text-sm text-blue-800 space-y-2">
              <li>• Use clear audio with minimal background noise</li>
              <li>• Ensure speakers are close to the microphone</li>
              <li>• Files under 100MB process faster</li>
              <li>• Supported formats: MP3, MP4, WAV, M4A, MOV, and more</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}