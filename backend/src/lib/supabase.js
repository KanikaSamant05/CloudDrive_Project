const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// service_role bypasses Row Level Security — never use in the frontend
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = { supabaseAdmin };
