import * as path from 'node:path';
import * as fs from 'node:fs/promises'; // Importing everything from 'fs/promises'
import { existsSync } from 'node:fs'; 
import { defineAppContext } from './appContext.mjs';


export const htmlCompiler = async (htmlContent, scriptPath, htmlTemp) => {
    let htmlOutput = htmlContent

        // Allows for templating in html with js variables
        if(existsSync(scriptPath)) {

           const scripts = await fs.readFile(scriptPath)
           const appContext = await defineAppContext()

           // Builds a function that returns a html string with variables
           const func = scriptString(scripts, htmlContent, appContext)
            htmlOutput = eval(func)()

            if(scripts) {
                htmlTemp = htmlTemp.replace(/<\!-- simply-script-tag -->/g, '<script src="/script.js"></script>')
            }
        }

        // const componentList = await insertReusableComponents(pageContent)
        // console.log("component List", componentList)

        htmlTemp = htmlTemp.replace(/<\!-- simply-page-content-->/g, htmlOutput);

        return htmlTemp
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

const insertReusableComponents = async (template) => {
    const componentList = await getDirectories(path.join(srcDir, '/components'))
    return componentList
}

const getDirectories = async source =>
    (await fs.readdir(source, { withFileTypes: true }))
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name)
