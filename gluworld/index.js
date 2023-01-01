import * as Gluon from '../src/index.js';

import { pathToFileURL } from 'node:url';
import { join } from 'node:path';

const __dirname = import.meta.dir;

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