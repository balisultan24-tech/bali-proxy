const http = require('http');
module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if(req.method === 'OPTIONS') return res.status(200).end();
  const url = `http://halive.cc:8080${req.url}`;
  const proxyReq = http.get(url, { headers: { 'User-Agent': 'VLC/3.0.20', 'Referer': 'http://halive.cc/' } }, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, { 'Content-Type': 'video/MP2T', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-cache' });
    proxyRes.pipe(res);
  });
  proxyReq.on('error', () => { if(!res.headersSent) res.status(500).send('Proxy error'); });
  req.on('close', () => proxyReq.destroy());
};