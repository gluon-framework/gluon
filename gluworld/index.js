import * as Gluon from '../src/index.js';

import { fileURLToPath, pathToFileURL } from 'https://deno.land/std@0.170.0/node/url.ts';
import { join, dirname } from 'https://deno.land/std@0.170.0/node/path.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

(async () => {
  if (Deno.args.length > 0) { // use argv as browsers to use
    for (const forceBrowser of Deno.args) {
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