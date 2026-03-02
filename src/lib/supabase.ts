import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://sihaesufrnipdnfuuuet.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpaGFlc3Vmcm5pcGRuZnV1dWV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzNjU3MzcsImV4cCI6MjA4Nzk0MTczN30._G44Z2ql4cIRUsMvii5nz3bMDmgEW9nTHlK4iYPgJNE';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
    },
    realtime: {
        params: { eventsPerSecond: 10 },
    },
});
