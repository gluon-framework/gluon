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
  const Chromium = await Gluon.open(pathToFileURL(join(__dirname, 'index.html')).href, {
    windowSize: [ 800, 500 ],
    forceBrowser: 'chrome_canary'
  });

  const Firefox = await Gluon.open(pathToFileURL(join(__dirname, 'index.html')).href, {
    windowSize: [ 800, 500 ],
    forceBrowser: 'firefox_nightly'
  });

  // const buildSize = await dirSize(__dirname);
  // Chromium.ipc.send('build size', buildSize);
})();