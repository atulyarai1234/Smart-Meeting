import Link from 'next/link';
export default function Home() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Smart Meeting Hub</h1>
      <p className="text-sm text-gray-600">Step 1: upload a recording to create a meeting.</p>
      <Link className="underline" href="/upload">Upload a recording →</Link>
    </div>
  );
}
