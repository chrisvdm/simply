const { createServer } = require('node:http');
const url = require('node:url')
const fs = require('node:fs/promises');

const routes = require('../web/routes')
 
const hostname = 'localhost';
const port = 1820;




const server = createServer(async (req, res) => {
    res.statusCode = 200;
    const pathname = url.parse(req.url).pathname;

    
const pageContent = await fs.readFile('/Users/Chris/dev/simply/web/pages/about/about.html', 'utf8')

  res.setHeader('Content-Type', 'text/html');
  res.end(`<div id='simply-app'>${pageContent}</div>`);
});

server.listen(port, hostname, () => {
    console.log(routes)
  console.log(`Server running at http://${hostname}:${port}`);
});