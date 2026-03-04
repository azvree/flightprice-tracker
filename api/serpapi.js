export default async function handler(req, res) {
  try {
    const query = new URLSearchParams(req.query).toString();
    const upstream = await fetch(`https://serpapi.com/search?${query}`);
    const data = await upstream.json().catch(() => ({}));
    res.setHeader('Content-Type', 'application/json');
    res.status(upstream.status).end(JSON.stringify(data));
  } catch (err) {
    res.status(500).json({ error: 'Proxy error: ' + err.message });
  }
}
