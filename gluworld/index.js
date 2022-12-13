import * as Gluon from '../gluon/index.js';

import { fileURLToPath, pathToFileURL } from 'url';
import { join, dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import { readdir, stat } from 'fs/promises';

const dirSize = async dir => {
  const files = await readdir(dir, { withFileTypes: true });

  const paths = files.map(async file => {
    const path = join(dir, file.name);

    if (file.isDirectory()) return await dirSize(path);
    if (file.isFile()) return (await stat(path)).size;

    return 0;
  });

  return (await Promise.all(paths)).flat(Infinity).reduce((acc, x) => acc + x, 0);
};

(async () => {
  if (process.argv.length > 2) { // use argv as browsers to use
    for (const forceBrowser of process.argv.slice(2)) {
      await Gluon.open(pathToFileURL(join(__dirname, 'index.html')).href, {
        windowSize: [ 800, 500 ],
        forceBrowser
      });
    }

    return;
  }

  const Browser = await Gluon.open(pathToFileURL(join(__dirname, 'index.html')).href, {
    windowSize: [ 800, 500 ]
  });

  // const buildSize = await dirSize(__dirname);
  // Chromium.ipc.send('build size', buildSize);
})();