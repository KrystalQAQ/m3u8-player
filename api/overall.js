import { createClient } from '@supabase/supabase-js';
import { URL } from 'url';

const supabaseUrl = 'https://yvvtpuzlsspsufkzdktc.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  const { searchParams } = new URL(req.url, `http://${req.headers.host}`);
  const password = searchParams.get('pd');
  const LOG_PASSWORD = process.env.LOG_PASSWORD;

  if (!LOG_PASSWORD) {
    return res.status(500).json({ error: 'Server is not configured for log viewing.' });
  }

  if (password !== LOG_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { data, error } = await supabase.rpc('get_overall_analysis');

    if (error) {
      throw error;
    }

    // The RPC function returns a single JSON object within an array
    if (data && data.length > 0) {
      res.status(200).json(data[0]);
    } else {
      throw new Error('No analysis data returned from the database function.');
    }

  } catch (error) {
    console.error('Error fetching overall analysis:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}