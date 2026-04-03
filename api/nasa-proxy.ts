export default async function handler(req: any, res: any) {
  // Set CORS header immediately
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(200).end();
  }

  const url = req.query.url;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid ?url= parameter' });
  }

  // Prevent abuse by asserting URL domain
  if (!url.startsWith('https://nasa.gov') && !url.startsWith('https://www.nasa.gov')) {
    return res.status(403).json({ 
      error: 'Forbidden: URL must start with https://nasa.gov or https://www.nasa.gov' 
    });
  }

  try {
    const response = await fetch(url);
    
    // Forward the content type
    const contentType = response.headers.get('content-type') || 'application/json';
    res.setHeader('Content-Type', contentType);

    // Read the response as an ArrayBuffer and convert to a Buffer 
    // to handle both text and binary data correctly
    const arrayBuffer = await response.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    return res.status(response.status).send(buffer);
  } catch (error: any) {
    console.error('NASA Proxy Error:', error);
    // Graceful error handling - return 502 with JSON
    return res.status(502).json({ error: 'Failed to fetch NASA endpoint' });
  }
}
