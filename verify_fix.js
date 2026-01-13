import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verify() {
    console.log('Verifying accommodation fix...');

    const { data, error } = await supabase
        .from('accommodations')
        .select('confirmation_code, user_id')
        .limit(1);

    if (error) {
        if (error.code === 'PGRST204') {
            console.error('FAIL: Missing column(s). Message:', error.message);
        } else {
            console.error('Error during verification:', error);
        }
    } else {
        console.log('SUCCESS: Columns confirmation_code and user_id exist (select query succeeded).');
    }
}

verify();
