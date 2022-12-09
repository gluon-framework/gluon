import * as Gluon from '../gluon/index.js';

import { fileURLToPath, pathToFileURL } from 'url';
import { join, dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

Gluon.open(pathToFileURL(join(__dirname, 'index.html')).href, () => {
  const setVersions = () => {
    if (typeof chromium_version === 'undefined') return setTimeout(setVersions, 100);

    chromium_version.textContent = CHROMIUM_VERSION;
    node_version.textContent = NODE_VERSION;
    gluon_version.textContent = GLUON_VERSION;
    glugun_version.textContent = 'GLUGUN_VERSION' === 'G\LUGUN_VERSION' ? 'nothing' : 'Glugun GLUGUN_VERSION';
  };

  setVersions();
}, {
  windowSize: [ 800, 450 ]
});