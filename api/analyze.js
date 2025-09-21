import { createClient } from '@supabase/supabase-js';
import { URL } from 'url';

const supabaseUrl = 'https://yvvtpuzlsspsufkzdktc.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  const { searchParams } = new URL(req.url, `http://${req.headers.host}`);
  const password = searchParams.get('pd');
  const ip = searchParams.get('ip');
  const LOG_PASSWORD = process.env.LOG_PASSWORD;

  if (!LOG_PASSWORD) {
    return res.status(500).json({ error: 'Server is not configured for log viewing.' });
  }

  if (password !== LOG_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!ip) {
    return res.status(400).json({ error: 'IP address is required' });
  }

  try {
    // 1. Get total log count for the IP
    const { count: totalLogs, error: countError } = await supabase
      .from('logs')
      .select('*', { count: 'exact', head: true })
      .eq('ip', ip);

    if (countError) throw countError;

    // 2. Get the favorite video
    const { data: favoriteVideo, error: favoriteVideoError } = await supabase
      .rpc('get_favorite_video_by_ip', { user_ip: ip });

    if (favoriteVideoError) throw favoriteVideoError;


    // 3. Calculate the rank
    const { data: ipCounts, error: ipCountsError } = await supabase.rpc('get_ip_log_counts');
    if (ipCountsError) throw ipCountsError;

    const rank = ipCounts.findIndex(item => item.ip === ip) + 1;

    res.status(200).json({
      totalLogs,
      favoriteVideo,
      rank: rank > 0 ? rank : 'N/A',
    });
  } catch (error) {
    console.error('Error fetching user analysis:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}