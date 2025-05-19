// supabaseClient.js
const SUPABASE_URL = process.env.CONNECTION_URL;
const SUPABASE_ANON_KEY = process.env.CONNECTION_KEY;

// Only initialize once
window.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
