import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const { action } = req.query;
      
      if (action === 'getAll') {
        const sessions = await kv.hgetall('paypal_sessions') || {};
        return res.status(200).json(sessions);
      }
      
      return res.status(400).json({ error: 'Invalid action' });
    }
    
    if (req.method === 'POST') {
      const { action, payload } = req.body;
      
      if (action === 'save') {
        const { id, session } = payload;
        await kv.hset('paypal_sessions', { [id]: session });
        return res.status(200).json({ success: true });
      }
      
      if (action === 'delete') {
        const { id } = payload;
        await kv.hdel('paypal_sessions', id);
        return res.status(200).json({ success: true });
      }
      
      if (action === 'clearResolved') {
        const sessions = await kv.hgetall('paypal_sessions') || {};
        const keysToDelete = Object.keys(sessions).filter(k => sessions[k].status === 'resolved');
        if (keysToDelete.length > 0) {
          await kv.hdel('paypal_sessions', ...keysToDelete);
        }
        return res.status(200).json({ success: true });
      }
      
      return res.status(400).json({ error: 'Invalid action' });
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('KV Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
