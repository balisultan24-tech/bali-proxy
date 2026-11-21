const http = require('http');

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const targetUrl = `http://halive.cc:8080${req.url}`;

  http.get(targetUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': '*/*' }
  }, (proxyRes) => {
    const chunks = [];
    proxyRes.on('data', c => chunks.push(c));
    proxyRes.on('end', () => {
      const buf = Buffer.concat(chunks);
      const text = buf.toString('utf8', 0, 200);

      // واش هو m3u8 حقيقي؟
      if (text.includes('#EXTM3U')) {
        let data = buf.toString('utf8');
        const rewritten = data.split('\n').map(line => {
          line = line.trim();
          if (!line || line.startsWith('#')) return line;
          if (line.startsWith('http')) {
            try { const u = new URL(line); return `https://bali-proxy.vercel.app${u.pathname}${u.search}`; } catch(e){ return line; }
          }
          if (line.includes('.ts') || line.includes('.m3u8')) {
            if (line.startsWith('/')) return `https://bali-proxy.vercel.app${line}`;
            const base = req.url.substring(0, req.url.lastIndexOf('/') + 1);
            return `https://bali-proxy.vercel.app${base}${line}`;
          }
          return line;
        }).join('\n');
        res.writeHead(200, { 'Content-Type': 'application/vnd.apple.mpegurl', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-cache' });
        return res.end(rewritten);
      }

      // إلا ماشي m3u8، راه ts، ندوزوه كيفما هو
      res.writeHead(200, { 'Content-Type': 'video/MP2T', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-cache' });
      res.end(buf);
    });
  }).on('error', () => {
    if (!res.headersSent) res.status(500).send('Proxy error');
  });
};
