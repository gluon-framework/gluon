import * as Gluon from '../gluon/index.js';

import { fileURLToPath, pathToFileURL } from 'url';
import { join, dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const Chromium = await Gluon.open(pathToFileURL(join(__dirname, 'index.html')).href, {
  windowSize: [ 800, 450 ]
});