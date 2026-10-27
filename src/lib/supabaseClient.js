import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let client;

if (supabaseUrl && supabaseAnonKey) {
  client = createClient(supabaseUrl, supabaseAnonKey);
} else {
  console.warn('Supabase environment variables are missing or incomplete. Client will be disabled.');
  // Export a stub that prevents runtime errors when supabase is used
  client = {
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve([]),
        }),
      }),
    }),
    // other Supabase methods can be stubbed as needed
  };
}

export const supabase = client;