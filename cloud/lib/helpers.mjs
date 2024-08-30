import * as path from 'node:path';
import * as fs from 'node:fs/promises'; // Importing everything from 'fs/promises'

// Helper function to find files by extension in a directory
export const findFilesByExtension = async (dir, extension) => {
  const files = await fs.readdir(dir);
  return files.filter(file => path.extname(file) === extension);
};


export const getDirectories = async source =>
  (await fs.readdir(source, { withFileTypes: true }))
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name)
