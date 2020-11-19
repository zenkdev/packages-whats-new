// List all files in a directory in Node.js recursively in a synchronous fashion
import fs from 'fs';
import path from 'path';

export default function walkSync(dir: string, fileList?: string[]): string[] {
  let ensureFileList = fileList || [];
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const pathName = path.join(dir, file);
    if (fs.statSync(pathName).isDirectory()) {
      ensureFileList = walkSync(pathName, ensureFileList);
    } else if (file === 'package.json') {
      ensureFileList.push(pathName);
    }
  });
  return ensureFileList;
}
