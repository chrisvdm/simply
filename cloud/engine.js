// Create a new isolate limited to 128MB 
// Causes segmentation error
// const ivm = require('isolated-vm');
// const isolate = new ivm.Isolate({ memoryLimit: 128 }); 

const fs = require('node:fs/promises');
const { existsSync } = require('node:fs')
const url = require('node:url')
const path = require("node:path");
const { createServer } = require('node:http');
const { lutimesSync } = require('node:fs');

const config = require('../web/config.json')

const hostname = 'localhost';
const port = 1820;

// route and dirPAth get defined  further down
let route = ''
let dirPath = ''

const server = createServer(async (req, res) => {
    res.statusCode = 200;

    const routes = await getRoutes()
    const routesList = Object.getOwnPropertyNames(routes)

    res.setHeader('Content-Type', 'text/html');
  
        if (req.url === '/favicon.ico') {
            return
        }

        if (req.url === '/script.js') {
            // Fetches user defined script.js
            new Promise(async (resolve) => {
                const scriptPath = `${dirPath}/script.js`
                const scripts = await fs.readFile(scriptPath)  
                resolve(scripts)
            }).then(result => {
                res.writeHead(200, { 'Content-Type': 'application/javascript' });
                res.end(result);
            })
            
        } else if (routesList.includes(req.url)) {
            // define active directory and route
            route = routes[req.url].name
            dirPath = path.join(__dirname, `../web/pages/${route}`)

            const pagePath = `${dirPath}/${route}.html`
            
            const getContent = new Promise(async (resolve, rej) => {
                // Allows for templating in html with js variables
                const scriptPath = `${dirPath}/script.js`
                const hasScripts = existsSync(scriptPath)

                const scripts =  hasScripts ? await fs.readFile(`${dirPath}/script.js`) : ''

                const pageContent =  await fs.readFile(pagePath, 'utf8')
                resolve([scripts, pageContent])
            })

            getContent.then(([scripts, output]) => {
                const appContext = defineAppContext({
                    routes: routes[req.url]
                })
                const func = scriptString(scripts, output, appContext)
                const pageContent = eval(func)()

                if (scripts === '') {
                    res.end(`<div id='simply-app'>${pageContent}</div>`);
                } else {
                    res.write(`<div id='simply-app'>${pageContent}</div>`);
                    res.end(`\n<script src="/script.js"></script>`)
                }
            
                
            })
        } 
});

server.listen(port, hostname, () => {
    console.log(`🌈 simply p.o.c. running at http://${hostname}:${port}`);
    console.log(`------------------------------------------------------`)
});

const defineAppContext = ({routes}) => {
    return {
        site: {...config},
        page: {...routes}
    }
}


const scriptString = (scripts, output, context) => {

    // Removes html comments
    output = output.replace(/<\!--.*?-->/g, "");

    return `() => {
        const appContext = ${JSON.stringify(context)}
        ${scripts}
        return (\`
            ${ output }
            \`
        )
    }`
}

const getRoutes = async() => {
    const routesMod = await import('../web/routes.mjs')
    const routes = routesMod.default
    return routes
}