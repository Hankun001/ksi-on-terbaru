// src/config/supabaseConfig.js

// Get environment variables
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate that required environment variables are present
// NOTE: We don't throw here to prevent blank page crashes.
// The app will show an error state instead.
if (!SUPABASE_URL) {
  console.warn('⚠️ VITE_SUPABASE_URL tidak dikonfigurasi. Silakan set di .env atau Vercel Environment Variables.');
}

if (!SUPABASE_ANON_KEY) {
  console.warn('⚠️ VITE_SUPABASE_ANON_KEY tidak dikonfigurasi. Silakan set di .env atau Vercel Environment Variables.');
}

export { SUPABASE_URL, SUPABASE_ANON_KEY };