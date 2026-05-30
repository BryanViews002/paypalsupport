import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const { action } = req.query;

      if (action === 'getAll') {
        const { data, error } = await supabase
          .from('sessions')
          .select('*');

        if (error) throw error;

        // Convert array to object keyed by session id
        const sessions = {};
        (data || []).forEach(row => {
          sessions[row.id] = row.data;
        });
        return res.status(200).json(sessions);
      }

      return res.status(400).json({ error: 'Invalid action' });
    }

    if (req.method === 'POST') {
      const { action, payload } = req.body;

      if (action === 'save') {
        const { id, session } = payload;
        const { error } = await supabase
          .from('sessions')
          .upsert({ id, data: session }, { onConflict: 'id' });

        if (error) throw error;
        return res.status(200).json({ success: true });
      }

      if (action === 'delete') {
        const { id } = payload;
        const { error } = await supabase
          .from('sessions')
          .delete()
          .eq('id', id);

        if (error) throw error;
        return res.status(200).json({ success: true });
      }

      if (action === 'clearResolved') {
        // Get all sessions first, then delete resolved ones
        const { data, error: fetchErr } = await supabase
          .from('sessions')
          .select('id, data');

        if (fetchErr) throw fetchErr;

        const resolvedIds = (data || [])
          .filter(row => row.data && row.data.status === 'resolved')
          .map(row => row.id);

        if (resolvedIds.length > 0) {
          const { error } = await supabase
            .from('sessions')
            .delete()
            .in('id', resolvedIds);
          if (error) throw error;
        }
        return res.status(200).json({ success: true });
      }

      return res.status(400).json({ error: 'Invalid action' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Supabase Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
