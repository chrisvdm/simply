import * as fs from 'node:fs/promises'; // Importing everything from 'fs/promises'
import { existsSync } from 'node:fs'; // Importing specific functions from 'fs'
import * as url from 'node:url'; // Importing everything from 'url'
import { createServer } from 'node:http'; // Importing 'createServer' from 'http'
import * as path from 'node:path';

const {fileURLToPath} = url
import { routes } from './lib/routes.mjs'
import { htmlCompiler } from './lib/htmlCompiler.mjs'; // Importing 'htmlCompiler' from 'htmlCompiler.mjs'

const hostname = 'localhost';
const port = 1820;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicDir = path.join(__dirname, './public');
const srcDir = path.join(__dirname, '../web')

// route and dirPAth get defined  further down
let route = ''
let dirPath = ''

const server = createServer(async (req, res) => {
    res.statusCode = 200;
    const pageRoutes = await routes()

    // template files
    let templateFile = await (await fs.readFile(`${publicDir}/index.html`)).toString()

    const routesList = await Object.getOwnPropertyNames(pageRoutes)

    res.setHeader('Content-Type', 'text/html');

    // Sort requests
  
        if (req.url === '/favicon.ico') {
            const favicon = await fs.readFile(path.join(__dirname, '/public/favicon.ico'))
            res.writeHead(200, {'Content-Type': 'image/x-icon'})
            res.end(favicon)
        }

        if (req.url === '/script.js') {
            // Fetches user defined script.js
            if(dirPath !== "") {
                const scriptPath = path.join(dirPath, 'script.js');
                if(existsSync(scriptPath)) {
                    const scriptContent = await fs.readFile(scriptPath);
                    res.writeHead(200, { 'Content-Type': 'application/javascript' });
                    res.end(scriptContent); 
                }  
            }
           
        } else if (routesList.includes(req.url)) {
            // define active directory and route
            route = pageRoutes[req.url].name
            dirPath = path.join(srcDir, `/pages/${route}`)

            const pagePath = path.join(dirPath,`/${route}.html`)
            const scriptPath = `${dirPath}/script.js`

            const rawContent =  await fs.readFile(pagePath, 'utf8')

            const htmlContent = await htmlCompiler(rawContent, scriptPath, templateFile)

            res.write(htmlContent)
            res.end()
        } 
});

server.listen(port, hostname, () => {
    console.log(`🌈 simply p.o.c. running at http://${hostname}:${port}`);
    console.log(`------------------------------------------------------`)
});
