///smart-meet/src/app/m/[id]/page.tsx
import { supabaseAdmin } from '@/lib/supabaseAdmin';


async function getMeeting(id: string) {
const { data } = await supabaseAdmin.from('meetings').select('*').eq('id', id).single();
return data;
}


export default async function MeetingPage({ params }: { params: { id: string } }) {
const meeting = await getMeeting(params.id);
if (!meeting) return <div className="text-red-600">Meeting not found</div>;
return (
<div className="space-y-6">
<h1 className="text-2xl font-semibold">{meeting.title}</h1>
<p className="text-sm text-gray-600">Status: {meeting.status}</p>
<div className="rounded border p-4 text-sm text-gray-700">
<p>Transcript will appear here after processing.</p>
</div>
</div>
);
}