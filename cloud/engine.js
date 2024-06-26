// Create a new isolate limited to 128MB
const ivm = require('isolated-vm');
const isolate = new ivm.Isolate({ memoryLimit: 128 });

const fs = require('node:fs/promises');
const url = require('node:url')
const { createServer } = require('node:http');

const hostname = 'localhost';
const port = 1820;

const server = createServer(async (req, res) => {
    res.statusCode = 200;
    const pathname = url.parse(req.url).pathname;
    console.log(pathname) 

    res.setHeader('Content-Type', 'text/html');
  
    const compilerContext = isolate.createContextSync();

    const jail = compilerContext.global;

    jail.setSync('global', jail.derefInto());

    jail.setSync('combine', () => {
        const pagePath = '/Users/Chris/dev/simply/web/pages/about/about.html'
        const pageFolderPath = '/Users/Chris/dev/simply/web/pages/about'

        const getContent = new Promise(async (resolve, rej) => {
            const scripts= await fs.readFile(`${pageFolderPath}/script.js`)
            const pageContent =  await fs.readFile(pagePath, 'utf8')
            resolve([scripts, pageContent])
        })

        getContent.then(([scripts, output]) => {
            const func = scriptString(scripts, output)
            const pageContent = eval(func)()

            res.write(`<script>${scripts}</script>`)
            res.end(`<div id='simply-app'>${pageContent}</div>`);
        })
        
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
        )}`
        }
