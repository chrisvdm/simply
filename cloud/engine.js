const { createServer } = require('node:http');
const url = require('node:url')
const fs = require('node:fs/promises');

const routes = require('../web/routes')
 
const hostname = 'localhost';
const port = 1820;

const server = createServer(async (req, res) => {
    res.statusCode = 200;
    const pathname = url.parse(req.url).pathname;
    const pagePath = '/Users/Chris/dev/simply/web/pages/about/about.html'
    const pageFolderPath = '/Users/Chris/dev/simply/web/pages/about'

    // await getComponents()

    const scripts = await fs.readFile(`${pageFolderPath}/script.js`)

    const pageContent = await fs.readFile(pagePath, 'utf8')

    res.setHeader('Content-Type', 'text/html');
    res.write(`<script>${scripts}</script>`)
    res.end(`<div id='simply-app'>${pageContent}</div>`);
});

server.listen(port, hostname, () => {
    console.log(`🌈 simply server running at http://${hostname}:${port}`);
    console.log(`------------------------------------------------------`)
});


const getComponents = async () => {
    const componentPath = '/Users/Chris/dev/simply/web/components'
    const dirContents = await fs.readdir(componentPath)
    console.log(dirContents[0])
}