const http = require('http');

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const targetUrl = `http://halive.cc:8080${req.url}`;

  const proxyReq = http.get(targetUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': '*/*' }
  }, (proxyRes) => {
    // ندوزوه مباشرة، بلا ما نتسناوه يسالي
    res.writeHead(proxyRes.statusCode, {
      'Content-Type': 'video/MP2T',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache'
    });
    proxyRes.pipe(res);
  });

  proxyReq.on('error', () => {
    if (!res.headersSent) res.status(500).send('Proxy error');
  });
  req.on('close', () => proxyReq.destroy());
};
