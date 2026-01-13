import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    const fakeTripId = '00000000-0000-0000-0000-000000000000';
    console.log('Using Fake Trip ID:', fakeTripId);

    // Try inserting into trip_checklist_items
    const task = {
        trip_id: fakeTripId,
        text: 'Debug Task',
        category: 'other',
        priority: 'recommended',
        is_completed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };

    console.log('Attempting insert into trip_checklist_items...');
    const { error: insertError } = await supabase
        .from('trip_checklist_items')
        .insert(task);

    if (insertError) {
        console.log('Error Code:', insertError.code);
        console.log('Error Message:', insertError.message);

        if (insertError.code === '23503') { // ForeignKeyViolation
            console.log('CONCLUSION: trip_checklist_items EXISTS and has correct schema! (FK violation received)');
        } else {
            console.log('Insert failed with other error.');
        }
    } else {
        console.log('Insert SUCCEEDED (Unexpected with fake ID)');
    }
}

test();
