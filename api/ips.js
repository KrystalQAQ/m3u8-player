import { createClient } from '@supabase/supabase-js';
import { URL } from 'url';

const supabaseUrl = 'https://yvvtpuzlsspsufkzdktc.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async (req, res) => {
  if (req.method === 'GET') {
    const requestUrl = new URL(req.url, `http://${req.headers.host}`);
    const password = requestUrl.searchParams.get('pd');
    const LOG_PASSWORD = process.env.LOG_PASSWORD;

    if (!LOG_PASSWORD) {
      return res.status(500).json({ error: 'Server is not configured for log viewing.' });
    }

    if (password !== LOG_PASSWORD) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      // Use a Remote Procedure Call (RPC) to get distinct IPs
      // This requires a function in your Supabase SQL editor:
      // CREATE OR REPLACE FUNCTION get_distinct_ips()
      // RETURNS TABLE(ip text) AS $$
      // BEGIN
      //   RETURN QUERY SELECT DISTINCT logs.ip FROM logs ORDER BY logs.ip;
      // END;
      // $$ LANGUAGE plpgsql;

      const { data, error } = await supabase.rpc('get_distinct_ips');

      if (error) {
        console.error('Supabase RPC error:', error);
        return res.status(500).json({ error: 'Failed to fetch unique IPs', details: error.message });
      }

      const ips = data.map(item => item.ip);
      return res.status(200).json(ips);
    } catch (error) {
      console.error('Error fetching unique IPs:', error);
      return res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
  }

  return res.status(405).send('Method Not Allowed');
};