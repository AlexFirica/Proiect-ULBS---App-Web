const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
// IMPORTANT: Pe backend folosim Service Key, NU Anon Key!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Lipsesc credențialele Supabase în .env');
}

// Clientul de admin utilizat pentru operațiuni securizate pe backend
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

module.exports = { supabase };