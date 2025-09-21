// Helper function to parse JSON body
const json = (req) => {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => {
      data += chunk;
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(data));
      } catch (e) {
        reject(e);
      }
    });
  });
};

export default async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  try {
    const body = await json(req);
    const { event, src, currentTime, userAgent } = body;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    // For debugging, log the received data
    console.log({
      timestamp: new Date().toISOString(),
      ip,
      userAgent,
      event,
      src,
      currentTime,
    });

    // In a real application, you would save this data to a database.
    
    res.status(200).json({ message: 'Logged successfully' });
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
};