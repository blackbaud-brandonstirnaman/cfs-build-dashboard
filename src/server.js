const http = require('http');
const fs = require('fs');

const baseUrl = process.env.VSTS_ADDRESS;
const baseVsrmUrl = process.env.VSTS_VSRM_ADDRESS;
const collectionPath = process.env.COLLECTION_PATH;
const bearerToken = process.env.BEARER_TOKEN;
const proxy = require('http-proxy').createProxyServer({
  auth: `:${bearerToken}`
});

const htmlPage = fs.readFileSync('index.html').toString();
const jsPage = fs.readFileSync('main.js').toString();
const server = http.createServer((req, res) => {
  let url = `${baseUrl}/${collectionPath}`;
  if (req.url.startsWith('/vsrm')) {
    req.url = '/' + req.url.substring(6);
    url = `${baseVsrmUrl}/${collectionPath}`;
  }

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
