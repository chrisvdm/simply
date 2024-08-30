import * as path from 'node:path';
import * as fs from 'node:fs/promises'; 
import { existsSync } from 'node:fs'; 
import { getDirectories, findFilesByExtension } from './helpers.mjs';

// Define __dirname for the ES module
const __filename = new URL(import.meta.url).pathname;
const __dirname = path.dirname(__filename);

// Define srcDir for locating files within the web directory
const srcDir = path.join(__dirname, '../../web');

// Limit the recursion depth to avoid infinite loops
const MAX_RECURSION_DEPTH = 10;

// Recursive function to replace custom component tags with their respective HTML content, including scripts and CSS
export const insertReusableComponents = async (template, htmlTemp, processedComponents, depth) => {
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