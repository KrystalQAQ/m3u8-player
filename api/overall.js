import { createClient } from '@supabase/supabase-js';
import { URL } from 'url';

const supabaseUrl = 'https://yvvtpuzlsspsufkzdktc.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  const { searchParams } = new URL(req.url, `http://${req.headers.host}`);
  const password = searchParams.get('pd');
  const shouldExport = searchParams.get('export') === 'true';
  const LOG_PASSWORD = process.env.LOG_PASSWORD;

  if (!LOG_PASSWORD) {
    return res.status(500).json({ error: 'Server is not configured for log viewing.' });
  }

  if (password !== LOG_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    if (shouldExport) {
      // Export logic
      const { data, error } = await supabase
        .from('logs')
        .select('video_title, video_src')
        .not('video_title', 'is', null)
        .not('video_src', 'is', null);

      if (error) throw error;

      const uniqueVideos = Array.from(new Map(data.map(item => [item.video_src, item])).values());

      let csv = '名称,链接\n';
      uniqueVideos.forEach(row => {
        csv += `"${row.video_title.replace(/"/g, '""')}","${row.video_src}"\n`;
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="videos.csv"');
      res.status(200).send(csv);

    } else {
      // Overall analysis logic
      const { data, error } = await supabase.rpc('get_overall_analysis');

      if (error) {
        throw error;
      }

      if (data) {
        res.status(200).json(data);
      } else {
        throw new Error('No analysis data returned from the database function.');
      }
    }
  } catch (error) {
    console.error('Error in overall API:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}