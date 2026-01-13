import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
    console.log('Inspecting accommodations table columns...');

    // We cannot access information_schema directly via supabase-js client easily without rpc or higher privs usually,
    // but let's try a simple select limit 1 and see what we get, or try to select specific columns.

    // Better strategy: Try to select all columns (select('*')) and print the keys of the returned object.

    const { data, error } = await supabase
        .from('accommodations')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error selecting *:', error);
    } else {
        if (data && data.length > 0) {
            console.log('Found row keys:', Object.keys(data[0]));
        } else {
            console.log('Table is empty, cannot inspect keys via select *. Attempting empty insert to provoke schema error?');
            // An empty table makes this hard. 
            // Let's assume the error message is correct and just check if we can select user_id specifically.
        }
    }

    const { error: errorUserId } = await supabase
        .from('accommodations')
        .select('user_id')
        .limit(1);

    if (errorUserId) {
        console.log('Select user_id result:', errorUserId.message);
    } else {
        console.log('Select user_id result: Success');
    }

}

inspect();
