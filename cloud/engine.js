// Create a new isolate limited to 128MB
const ivm = require('isolated-vm');
const isolate = new ivm.Isolate({ memoryLimit: 128 });

const fs = require('node:fs/promises');
const url = require('node:url')
const path = require("node:path");
const { createServer } = require('node:http');

const hostname = 'localhost';
const port = 1820;

 let route = ''

const server = createServer(async (req, res) => {
    res.statusCode = 200;
   
    const pathnamefirst = url.parse(req.url).pathname;
    const pathname = path.join(__dirname, `../web/pages${route}${req.url}`)
    console.log("pathname", pathname) 
    console.log('req.url', req.url)
    console.log(url.hostname)

    const pages = await getPageNames()
    

    res.setHeader('Content-Type', 'text/html');
  
    const compilerContext = isolate.createContextSync();

    const jail = compilerContext.global;

    jail.setSync('global', jail.derefInto());

    jail.setSync('combine', () => {
        if (req.url === '/favicon.ico') {
            return
        }

        if (req.url === '/script.js') {
            new Promise(async (resolve) => {
                const scriptPath = path.join(__dirname, `../web/pages${route}/script.js`)
                const scripts = await fs.readFile(scriptPath)  
                resolve(scripts)
            }).then(result => {
                res.writeHead(200, { 'Content-Type': 'application/javascript' });
                res.end(result);
            })
            
        } else if (pages.includes(req.url)) {
            route = req.url
            const pagePath = `${pathname}${req.url}.html`
            
            const getContent = new Promise(async (resolve, rej) => {
                const scripts = await fs.readFile(`${pathname}/script.js`)  
                const pageContent =  await fs.readFile(pagePath, 'utf8')
                resolve([scripts, pageContent])
            })

            getContent.then(([scripts, output]) => {
                const func = scriptString(scripts, output)
                const pageContent = eval(func)()

                
                res.write(`<div id='simply-app'>${pageContent}</div>`);
                res.end(`\n<script src="/script.js"></script>`)
            })
        }

        
    });

    compilerContext.eval('combine()');    
});

server.listen(port, hostname, () => {
    console.log(`🌈 simply p.o.c. running at http://${hostname}:${port}`);
    console.log(`------------------------------------------------------`)
});


const scriptString = (scripts, output) => {

    // Removes html comments
    output = output.replace(/<\!--.*?-->/g, "");

    return `() => {
        ${scripts}
        return (\`
            ${ output }
            \`
        )
    }`
}

const getPageNames = async() => {
    const dirContent = await fs.readdir(path.join(__dirname, '../web/pages'), { withFileTypes: true })
    return dirContent.map(i => {
        return `/${i.name}`
    })
}