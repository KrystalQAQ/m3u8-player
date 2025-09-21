import { createClient } from '@supabase/supabase-js';

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
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  if (!supabaseKey) {
    console.error('Supabase key is not set. Make sure SUPABASE_KEY environment variable is configured.');
    return res.status(500).json({ error: 'Server configuration error.' });
  }

  try {
    const body = await json(req);
    const { event, src, currentTime, userAgent } = body;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    const { data, error } = await supabase
      .from('logs')
      .insert([
        {
          ip: ip,
          user_agent: userAgent,
          event: event,
          video_src: src,
          current_time: currentTime
        },
      ]);

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Failed to save log', details: error.message });
    }

    res.status(200).json({ message: 'Logged successfully', data: data });
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
};