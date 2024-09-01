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
const globalCssDir = path.join(srcDir, 'css'); 
const componentDir = path.join(srcDir, 'components');

// route and dirPath get defined  further down
let route = ''
let dirPath = ''
let urlThingy = ''

const getDirPathForRoute = r => {
    return path.join(srcDir, `pages/${r}`)
}

const serveStaticFile = async (res, filePath, contentType) => {
    if (existsSync(filePath)) {
        const fileContent = await fs.readFile(filePath);
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(fileContent);
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('File not found');
    }
};

const server = createServer(async (req, res) => {
    res.statusCode = 200;

    try {

         // Parse the incoming URL to separate the pathname and query parameters
         const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
         const mainUrl = parsedUrl.pathname; // This is the main part of the URL
         const queryParams = parsedUrl.searchParams; // This is the query parameters part
 
        // Serve component-specific JS files
        if (mainUrl.startsWith('/components/') && mainUrl.endsWith('.js')) {
            const componentJsPath = path.join(componentDir, req.url.replace('/components/', ''));
            await serveStaticFile(res, componentJsPath, 'application/javascript');
            return;
        }

        // Serve component-specific CSS files
        if (mainUrl.startsWith('/components/') && mainUrl.endsWith('.css')) {
            const componentCssPath = path.join(componentDir, mainUrl.replace('/components/', ''));
            await serveStaticFile(res, componentCssPath, 'text/css');
            return;
        }

        res.setHeader('Content-Type', 'text/html');

        // template files
        let templateFile = await (await fs.readFile(path.join(publicDir,'index.html'))).toString()

        // get user defined routes configuration
        const pageRoutes = await routes()
        const routesList = await Object.getOwnPropertyNames(pageRoutes)


        // Handle favicon
        if (mainUrl === '/favicon.ico') {
            const favicon = await fs.readFile(path.join(publicDir, 'favicon.ico'))
            res.writeHead(200, {'Content-Type': 'image/x-icon'})
            res.end(favicon)
            return
        }

        // Handle global script
        if (mainUrl === '/script.js') {
            if (dirPath !== "") {
                const scriptFiles = await fs.readdir(dirPath);
                const jsFiles = scriptFiles.filter(file => file.endsWith('.js'));

                if (jsFiles.length > 0) {
                    for (const jsFile of jsFiles) {
                        const scriptPath = path.join(dirPath, jsFile);
                        if (existsSync(scriptPath)) {
                            const scriptContent = await fs.readFile(scriptPath);
                            res.writeHead(200, { 'Content-Type': 'application/javascript' });
                            res.end(scriptContent);
                            return;
                        }
                    }
                }
            }
        }

        // Handle page-specific JS files with non-specific names
        if (mainUrl.startsWith('/pages/') && mainUrl.endsWith('.js')) {
            const jsFilePath = path.join(srcDir, mainUrl); // Directly use the request URL to find the file
            await serveStaticFile(res, jsFilePath, 'application/javascript');
            return;
        }

        // Handle CSS requests
        if (mainUrl.endsWith('.css')) {
            let cssPath;
            if (mainUrl.startsWith('/css/')) {
                // Global CSS file
                cssPath = path.join(globalCssDir, mainUrl.replace('/css/', ''));
            } else {
                // Route/Component-specific CSS file
                cssPath = path.join(srcDir, `pages/${route}`, mainUrl.split('/').pop());
            }

            await serveStaticFile(res, cssPath, 'text/css');
            return;
        }

        // Handle dynamic routes
        if (routesList.includes(mainUrl)) {
            // define active directory and route
            route = pageRoutes[mainUrl].name
            dirPath = getDirPathForRoute(route)
            urlThingy = mainUrl

            const htmlContent = await htmlCompiler(dirPath, route, templateFile,urlThingy)

            res.write(htmlContent)
            res.end()
            return
        } 

        // Handle 404 Not Found
        const notFoundPage = await fs.readFile(path.join(publicDir, '404.html'));
        res.writeHead(404, { 'Content-Type': 'text/html' });
        console.error("404: Check to make sure your routes are configured correctly. Routes must start with '/'")
        res.end(notFoundPage);

    } catch (error) {
        console.error('Error handling request:', error);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Internal Server Error');
    }
});

server.listen(port, hostname, () => {
    console.log(`🌈 simply p.o.c. running at http://${hostname}:${port}`);
    console.log(`------------------------------------------------------`)
});
