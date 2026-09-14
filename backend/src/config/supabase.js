const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabaseUrl = process.env.SUPABASE_URL;

// Definim corect variabila din process.env
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

// Verificăm dacă variabilele există
if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('⚠️ SUPABASE_URL sau SUPABASE_SERVICE_ROLE_KEY/SUPABASE_ANON_KEY lipsesc din fișierul .env!');
}

// Instanțiem clientul Supabase
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Exportăm clientul
module.exports = supabase;