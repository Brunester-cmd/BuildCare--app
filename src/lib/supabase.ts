import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://inkmvuqmvmqbxvzvcuat.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlua212dXFtdm1xYnh2enZjdWF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1NjY2MzMsImV4cCI6MjA4ODE0MjYzM30.7KvTZ5EtjnGeVVFiDVA23ijea8ZFazrGt7xyRK4GVfc';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
    },
    realtime: {
        params: { eventsPerSecond: 10 },
    },
});
