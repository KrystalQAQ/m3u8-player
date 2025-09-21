import { getDb } from '../src/db.js';

export default async function handler(req, res) {
  const { searchParams } = new URL(req.url, `http://${req.headers.host}`);
  const password = searchParams.get('pd');
  const ip = searchParams.get('ip');

  if (password !== process.env.PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!ip) {
    return res.status(400).json({ error: 'IP address is required' });
  }

  try {
    const db = await getDb();

    // 1. Get total log count for the IP
    const totalLogsResult = await db.get('SELECT COUNT(*) as totalLogs FROM logs WHERE ip = ?', ip);
    const totalLogs = totalLogsResult.totalLogs;

    // 2. Get the favorite video
    const favoriteVideoResult = await db.get(
      "SELECT video_title FROM logs WHERE ip = ? AND event = 'seeking' AND video_title IS NOT NULL GROUP BY video_title ORDER BY COUNT(*) DESC LIMIT 1",
      ip
    );
    const favoriteVideo = favoriteVideoResult ? favoriteVideoResult.video_title : null;

    // 3. Calculate the rank
    const ipCounts = await db.all('SELECT ip, COUNT(*) as count FROM logs GROUP BY ip ORDER BY count DESC');
    const rank = ipCounts.findIndex(item => item.ip === ip) + 1;


    res.status(200).json({
      totalLogs,
      favoriteVideo,
      rank: rank > 0 ? rank : 'N/A',
    });
  } catch (error) {
    console.error('Error fetching user analysis:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}