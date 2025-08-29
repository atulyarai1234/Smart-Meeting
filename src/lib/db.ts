import { supabaseAdmin } from './supabaseAdmin';

export async function createMeeting(title: string) {
  const { data, error } = await supabaseAdmin
    .from('meetings')
    .insert({ title, source: 'manual', status: 'created' })
    .select('*')
    .single();
  if (error) throw error;
  return data;
}
