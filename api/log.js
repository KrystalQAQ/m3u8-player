module.exports = (req, res) => {
  if (req.method === 'POST') {
    const { event, src, currentTime, userAgent } = req.body;
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    // In a real application, you would save this data to a database.
    // For this example, we'll just log it to the console.
    console.log({
      timestamp: new Date().toISOString(),
      ip,
      userAgent,
      event,
      src,
      currentTime,
    });

    res.status(200).send('Logged successfully');
  } else {
    res.status(405).send('Method Not Allowed');
  }
};