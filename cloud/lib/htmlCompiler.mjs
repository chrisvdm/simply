import * as path from 'node:path';
import * as fs from 'node:fs/promises'; // Importing everything from 'fs/promises'
import { existsSync } from 'node:fs'; 
import { defineAppContext } from './appContext.mjs';
import { insertReusableComponents } from './insertReusableComponents.mjs'

export const htmlCompiler = async (dirPath, route, htmlTemp, urlThingy) => {
    const htmlPath = path.join(dirPath,`${route}.html`)
    const scriptPath = path.join(dirPath, 'script.js')
    const cssPath = path.join(dirPath, 'styles.css'); 

   let rawContent =  await fs.readFile(htmlPath, 'utf8')

        // Replace custom components with their HTML content
        rawContent = await insertReusableComponents(rawContent, htmlTemp, new Set(), 0);

    let htmlOutput = rawContent

        // Allows for templating in html with js variables
           const appContext = await defineAppContext(urlThingy)

           // Builds a function that returns a html string with variables
           const funcString = await scriptString(scriptPath, rawContent, appContext)
           const func = new Function(funcString);
            htmlOutput = func()

            if(existsSync(scriptPath)) {
                // Add a global script tag to define appContext
    htmlTemp = htmlTemp.replace(
        /<\!-- simply-script-tag -->/g,
        `<script>const appContext = ${JSON.stringify(appContext)};</script><script src="/script.js"></script>`
    );
            } else {
                htmlTemp = htmlTemp.replace(
                    /<\!-- simply-script-tag -->/g,
                    `<script>const appContext = ${JSON.stringify(appContext)};</script>`
                ); 
            }

        // Add route-specific CSS if exists
    if (existsSync(cssPath)) {
        htmlTemp = htmlTemp.replace(/<\!-- simply-css-tag -->/g, `<link rel="stylesheet" href="/pages/${route}/styles.css">`);
    } else {
        // Remove the CSS tag placeholder if no route-specific CSS is found
        htmlTemp = htmlTemp.replace(/<\!-- simply-css-tag -->/g, '');
    }

    // Handle global CSS (assuming global CSS is in a specific directory like 'web/css')
    const globalCssPath = path.join(dirPath, '../../css/global.css');
    if (existsSync(globalCssPath)) {
        htmlTemp = htmlTemp.replace(/<\!-- simply-global-css-tag -->/g, `<link rel="stylesheet" href="/css/global.css">`);
    } else {
        htmlTemp = htmlTemp.replace(/<\!-- simply-global-css-tag -->/g, '');
    }

        htmlTemp = htmlTemp.replace(/<\!-- simply-page-content-->/g, htmlOutput);

        return htmlTemp
}

const scriptString = async (scriptPath, output, context) => {
    let scripts = ''
    if(existsSync(scriptPath)) {
        scripts = await fs.readFile(scriptPath)
    }

    // Removes html comments
    output = output.replace(/<\!--.*?-->/g, "");

    // Safely serialize context using JSON.stringify
    const contextString = JSON.stringify(context);

    return `
        const appContext = ${contextString};
        ${scripts}
        return \`
            ${output}
        \`;
    `;
}

