const http = require('http');
const fs = require('fs');
const baseUrl = process.env.VSTS_ADDRESS;
const collectionPath = process.env.COLLECTION_PATH;
const bearerToken = process.env.BEARER_TOKEN;
const proxy = require('http-proxy').createProxyServer({
  auth: `:${bearerToken}`
});

const htmlPage = fs.readFileSync('index.html').toString();
const jsPage = fs.readFileSync('main.js').toString();
const server = http.createServer((req, res) => {
  const url = `${baseUrl}/${collectionPath}`;

  if (req.url === '/favicon.ico') {
    return res.end();
  } else if (req.url === '/main.js') {
    return res.end(mainJs);
  } else if (req.url === '/index.html') {
    return res.end(htmlPage);
  }

  proxy.web(req, res, {
    changeOrigin: true,
    target: url
  }, (e) => console.error(e));
});

server.listen(5000);
