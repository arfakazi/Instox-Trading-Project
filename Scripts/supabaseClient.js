// supabaseClient.js
const SUPABASE_URL = CONNECTION_URL;
const SUPABASE_ANON_KEY = CONNECTION_KEY;

// Only initialize once
window.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
