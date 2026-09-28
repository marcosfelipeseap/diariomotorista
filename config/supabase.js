const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

// Inicializa com options para usar o schema diariomotorista
const supabase = createClient(supabaseUrl, supabaseKey, {
    db: {
        schema: 'diariomotorista',
    },
});

module.exports = supabase;