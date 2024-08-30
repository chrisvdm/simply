import * as path from 'node:path';
import * as fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import * as url from 'node:url'; // Importing everything from 'url'

import { getDirectories, findFilesByExtension } from './helpers.mjs';

const { fileURLToPath } = url;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to parse props from the component tag
const parseProps = (tag) => {
    const props = {};
    const propsRegex = /(\w+)="([^"]*)"/g;
    let match;
    while ((match = propsRegex.exec(tag)) !== null) {
        props[match[1]] = match[2];
    }
    return props;
};

export const processComponents = async (template, htmlTemp) => {
    const componentDir = path.join(__dirname, '../../web/components');
    const componentNames = await getDirectories(componentDir);
    const componentMap = new Map();

    // Load all components into componentMap
    for (const componentName of componentNames) {
        const componentPath = path.join(componentDir, componentName, `${componentName}.html`);
        if (existsSync(componentPath)) {
            const componentContent = await fs.readFile(componentPath, 'utf8');
            componentMap.set(componentName, componentContent);
        }
    }

    let componentFound = true;

    // Iterate until no more components are found in the template
    while (componentFound) {
        componentFound = false;

        for (const [componentName, componentContent] of componentMap.entries()) {
            const regex = new RegExp(`<${componentName}([^>]*)>(.*?)</${componentName}>`, 'gs');
            let match;

            while ((match = regex.exec(template)) !== null) {
                componentFound = true;
                const [fullMatch, propsString, childrenContent] = match;
                const props = parseProps(propsString);

                // Replace ${children} and ${props.*} placeholders
                let filledContent = componentContent.replace('${children}', childrenContent.trim());
                for (const [key, value] of Object.entries(props)) {
                    const propPlaceholder = new RegExp(`\\$\\{props\\.${key}\\}`, 'g');
                    filledContent = filledContent.replace(propPlaceholder, value);
                }

                template = template.replace(fullMatch, filledContent);

                // Include component-specific CSS files
                const cssFiles = await findFilesByExtension(path.join(componentDir, componentName), '.css');
                for (const cssFile of cssFiles) {
                    const cssLink = `<link rel="stylesheet" href="/components/${componentName}/${cssFile}">`;
                    if (!htmlTemp.includes(cssLink)) {
                        htmlTemp = htmlTemp.replace('<!-- simply-component-css-tag -->', `${cssLink}\n<!-- simply-component-css-tag -->`);
                    }
                }

                // Include component-specific JS files and pass props
                const scriptFiles = await findFilesByExtension(path.join(componentDir, componentName), '.js');
                for (const scriptFile of scriptFiles) {
                    const propsScriptTag = `<script>const props = ${JSON.stringify(props)};</script>`;
                    const scriptTag = `<script src="/components/${componentName}/${scriptFile}"></script>`;
                    if (!htmlTemp.includes(scriptTag)) {
                        // Ensure the props are defined before the actual script is run
                        htmlTemp = htmlTemp.replace('<!-- simply-component-script-tag -->', `${propsScriptTag}\n${scriptTag}\n<!-- simply-component-script-tag -->`);
                    }
                }  
            }
        }
    }

    return {template:template, htmlTemplate: htmlTemp};
};