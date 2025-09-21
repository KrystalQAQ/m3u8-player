import { createClient } from '@supabase/supabase-js';
import { URL } from 'url';

// Helper function to parse JSON body
const json = (req) => {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => {
      data += chunk;
    });
    req.on('end', () => {
      try {
        // Ensure data is not empty before parsing
        if (data) {
          resolve(JSON.parse(data));
        } else {
          resolve({});
        }
      } catch (e) {
        reject(e);
      }
    });
  });
};

const supabaseUrl = 'https://yvvtpuzlsspsufkzdktc.supabase.co';
// Ensure SUPABASE_KEY is read from environment variables
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async (req, res) => {
  if (req.method === 'POST') {
    if (!supabaseKey) {
      console.error('Supabase key is not set. Make sure SUPABASE_KEY environment variable is configured.');
      return res.status(500).json({ error: 'Server configuration error.' });
    }

    try {
      const body = await json(req);
      // console.log(body);
      const { event, src, currentTime, userAgent, title } = body;
      const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

      const { data, error } = await supabase
        .from('logs')
        .insert([
          {
            ip: ip,
            user_agent: userAgent,
            event: event,
            video_src: src,
            current_time: currentTime,
            video_title: title
          },
        ]);

      if (error) {
        console.error('Supabase error:', error);
        return res.status(500).json({ error: 'Failed to save log', details: error.message });
      }

      return res.status(200).json({ message: 'Logged successfully', data: data });
    } catch (error) {
      console.error('Error processing request:', error);
      return res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
  }

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
      const { data, error } = await supabase
        .from('logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        return res.status(500).json({ error: 'Failed to fetch logs', details: error.message });
      }

      return res.status(200).json(data);
    } catch (error) {
      console.error('Error fetching logs:', error);
      return res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
  }

  return res.status(405).send('Method Not Allowed');
};