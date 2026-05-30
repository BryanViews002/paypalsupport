import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  const results = {};

  // Check env vars
  results.hasUrl = !!process.env.SUPABASE_URL;
  results.hasKey = !!process.env.SUPABASE_ANON_KEY;
  results.url = process.env.SUPABASE_URL || 'MISSING';

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    return res.status(200).json({ ...results, error: 'Missing env vars' });
  }

  try {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

    // Try to read from sessions table
    const { data, error } = await supabase.from('sessions').select('*').limit(1);
    results.selectData = data;
    results.selectError = error ? error.message : null;

    // Try to insert a test row
    const { error: insertError } = await supabase
      .from('sessions')
      .upsert({ id: 'test-debug-row', data: { test: true } }, { onConflict: 'id' });
    results.insertError = insertError ? insertError.message : null;

    // Try to delete the test row
    const { error: deleteError } = await supabase
      .from('sessions')
      .delete()
      .eq('id', 'test-debug-row');
    results.deleteError = deleteError ? deleteError.message : null;

    results.status = 'OK';
  } catch (e) {
    results.exception = e.message;
  }

  return res.status(200).json(results);
}
