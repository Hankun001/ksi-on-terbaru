// src/config/supabaseConfig.js

// Get environment variables
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate that required environment variables are present
if (!SUPABASE_URL) {
  console.error('Missing VITE_SUPABASE_URL environment variable');
  throw new Error('Supabase URL is required. Please set VITE_SUPABASE_URL in your environment variables.');
}

if (!SUPABASE_ANON_KEY) {
  console.error('Missing VITE_SUPABASE_ANON_KEY environment variable');
  throw new Error('Supabase Anon Key is required. Please set VITE_SUPABASE_ANON_KEY in your environment variables.');
}

export { SUPABASE_URL, SUPABASE_ANON_KEY };