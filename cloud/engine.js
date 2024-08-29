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

const publicDir = path.join(__dirname,'./public')

// route and dirPAth get defined  further down
let route = ''
let dirPath = ''

const componentList = (async() => {(await fs.readdir(path.join(__dirname,'../web/components'), { withFileTypes: true }))
.filter(dirent => dirent.isDirectory())
.map(dirent => dirent.name)})()

const server = createServer(async (req, res) => {
    res.statusCode = 200;

    const routes = await getRoutes()
    const routesList = Object.getOwnPropertyNames(routes)

   let templateFile = await (await fs.readFile(`${publicDir}/index.html`)).toString()

    res.setHeader('Content-Type', 'text/html');

    // Sort requests
  
        if (req.url === '/favicon.ico') {
            const favicon = await fs.readFile(path.join(__dirname, '/public/favicon.ico'))
            res.writeHead(200, {'Content-Type': 'image/favicon'})
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

                // const newStuff = insertReusableComponents(output)
                // console.log(newStuff)

                const func = scriptString(scripts, output, appContext)
                const pageContent = eval(func)()

                if(scripts) {
                    templateFile = templateFile.replace(/<\!-- simply-script-tag -->/g, '<script src="/script.js"></script>')
                }
                

                templateFile = templateFile.replace(/<\!-- simply-page-content-->/g, pageContent);
                res.write(templateFile)
                res.end()
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

const insertReusableComponents = (output) => {
    console.log(componentList)
}

const getDirectories = async source =>
    (await fs.readdir(source, { withFileTypes: true }))
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name)



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