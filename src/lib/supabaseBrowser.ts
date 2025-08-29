import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
// import { Database } from './types.gen'; // optional if you generated types


export const supabaseBrowser = () =>
createClientComponentClient();