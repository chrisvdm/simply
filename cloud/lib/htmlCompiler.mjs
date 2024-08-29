import * as path from 'node:path';
import * as fs from 'node:fs/promises'; // Importing everything from 'fs/promises'
import { existsSync } from 'node:fs'; 
import { defineAppContext } from './appContext.mjs';

// Define __dirname for the ES module
const __filename = new URL(import.meta.url).pathname;
const __dirname = path.dirname(__filename);

// Define srcDir for locating files within the web directory
const srcDir = path.join(__dirname, '../../web');

// Limit the recursion depth to avoid infinite loops
const MAX_RECURSION_DEPTH = 10;

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

// Recursive function to replace custom component tags with their respective HTML content, including scripts and CSS
const insertReusableComponents = async (template, htmlTemp, processedComponents, depth) => {
    const componentDir = path.join(srcDir, 'components');
    const componentNames = await getDirectories(componentDir);

    if (depth > MAX_RECURSION_DEPTH) {
        console.warn(`Reached maximum recursion depth at ${depth}. Possible circular reference detected.`);
        return template;
    }

    let componentFound = false;

    for (const componentName of componentNames) {
        if (processedComponents.has(componentName)) {
            continue; // Skip already processed components to prevent loops
        }

        const componentPath = path.join(componentDir, componentName, `${componentName}.html`);

        if (existsSync(componentPath)) {
            let componentContent = await fs.readFile(componentPath, 'utf8');

            // Add current component to processed set to avoid reprocessing
            processedComponents.add(componentName);

            
            // Recursively replace nested components within this component
            componentContent = await insertReusableComponents(componentContent, htmlTemp, processedComponents, depth + 1);

            const regex = new RegExp(`<${componentName}></${componentName}>`, 'g');

            if (regex.test(template)) {
                template = template.replace(regex, componentContent);
                componentFound = true;

                // Find all CSS files in the component directory and include them
                const cssFiles = await findFilesByExtension(path.join(componentDir, componentName), '.css');
                cssFiles.forEach(cssFile => {
                    htmlTemp = htmlTemp.replace(/<\!-- simply-component-css-tag -->/g, `<link rel="stylesheet" href="/components/${componentName}/${cssFile}">`);
                });

                // Find all JS files in the component directory and include them
                const scriptFiles = await findFilesByExtension(path.join(componentDir, componentName), '.js');
                scriptFiles.forEach(scriptFile => {
                    htmlTemp = htmlTemp.replace(/<\!-- simply-component-script-tag -->/g, `<script src="/components/${componentName}/${scriptFile}"></script>`);
                });
            } 
            // Remove the component from the processed set after processing
            processedComponents.delete(componentName);
        }
    }

    // If a component was found and replaced, check for nested components recursively
    if (componentFound) {
        template = await insertReusableComponents(template, htmlTemp, processedComponents, depth + 1);
    }

    return template;
};

// Helper function to find files by extension in a directory
const findFilesByExtension = async (dir, extension) => {
    const files = await fs.readdir(dir);
    return files.filter(file => path.extname(file) === extension);
};


const getDirectories = async source =>
    (await fs.readdir(source, { withFileTypes: true }))
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name)
