const http = require('http');

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const targetUrl = `http://halive.cc:8080${req.url}`;
  const isM3u8 = req.url.includes('.m3u8');

  const proxyReq = http.get(targetUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0',
      'Referer': 'http://halive.cc/',
      'Accept': '*/*'
    }
  }, (proxyRes) => {

    // إلا كان m3u8، خاصنا نبدلو الروابط اللي لداخل باش يدوزو من البروكسي
    if (isM3u8) {
      let data = '';
      proxyRes.on('data', chunk => data += chunk);
      proxyRes.on('end', () => {
        // أي سطر فيه .ts ولا .m3u8، نردوه يدوز من vercel ديالنا
        const rewritten = data.split('\n').map(line => {
          line = line.trim();
          if (!line || line.startsWith('#')) return line;
          // إلا كان رابط كامل
          if (line.startsWith('http')) {
            try {
              const u = new URL(line);
              return `https://bali-proxy.vercel.app${u.pathname}${u.search}`;
            } catch(e){ return line; }
          }
          // إلا كان رابط نسبي بحال 258.ts ولا /live/...
          if (line.includes('.ts') || line.includes('.m3u8')) {
            if (line.startsWith('/')) return `https://bali-proxy.vercel.app${line}`;
            // نبني المسار من الرابط الأصلي
            const base = req.url.substring(0, req.url.lastIndexOf('/') + 1);
            return `https://bali-proxy.vercel.app${base}${line}`;
          }
          return line;
        }).join('\n');

        res.writeHead(200, {
          'Content-Type': 'application/vnd.apple.mpegurl',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-cache'
        });
        res.end(rewritten);
      });
    } else {
      // إلا كان .ts، ندوزوه كيفما هو
      res.writeHead(proxyRes.statusCode, {
        'Content-Type': 'video/MP2T',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache'
      });
      proxyRes.pipe(res);
    }
  });

  proxyReq.on('error', () => {
    if (!res.headersSent) res.status(500).send('Proxy error');
  });
  req.on('close', () => proxyReq.destroy());
};
