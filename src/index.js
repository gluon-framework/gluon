import { join, isAbsolute } from 'node:path';
import { log } from './lib/logger.js';

import chromium from './browser/chromium.js';
import firefox from './browser/firefox.js';

import * as ExtensionsAPI from './extensions.js';
import LocalHTTP from './lib/local/http.js';
import { getBrowserPaths } from './utils/browserPaths.js'
import { generatePort } from './utils/generatePort.js'
import { getBinariesInPath } from './utils/getBinariesInPath.js'
import { getFriendlyName } from './utils/getFriendlyName.js'
import { getDataPath } from './utils/getDataPath.js'
import { getBrowserType } from './utils/getBrowserType.js'
import { findBrowserPath } from './utils/findBrowserPath.js'

process.versions.gluon = '0.13.0-alpha.2';

const browserPaths = getBrowserPaths()
const binariesInPath = getBinariesInPath()

const startBrowser = async (url, { allowHTTP = false, allowRedirects = 'same-origin', windowSize, forceBrowser, forceEngine }) => {
  const { path: browserPath, name: browserName } = await findBrowserPath(forceBrowser, forceEngine, { browserPaths, binariesInPath });
  const browserFriendlyName = getFriendlyName(browserName);

  if (!browserPath) return log('failed to find a good browser install');

  const dataPath = getDataPath(browserName);
  const browserType = getBrowserType(browserName);

  log('found browser', browserName, `(${browserType} based)`, 'at path:', browserPath);
  log('data path:', dataPath);

  const openingLocal = !url.includes('://');
  const localUrl = browserType === 'firefox' ? `http://localhost:${generatePort()}` : 'https://gluon.local';
  const basePath = isAbsolute(url) ? url : join(process.cwd(), url);

  const closeHandlers = [];
  if (openingLocal && browserType === 'firefox') closeHandlers.push(await LocalHTTP({ localUrl, url: basePath }));

  let winConstructor = browserType === 'firefox' ? firefox : chromium

  return await winConstructor({
    dataPath,
    browserPath
  }, {
    url: openingLocal ? localUrl : url,
    windowSize,
    allowHTTP,
    extensions: ExtensionsAPI._extensions[browserType]
  }, {
    browserName: browserFriendlyName,
    url: openingLocal ? basePath : url,
    localUrl,
    openingLocal,
    closeHandlers,
    browserType,
    dataPath,
    allowRedirects
  });
};

export const open = async (url, opts = {}) => {
  const { onLoad, allowHTTP = false } = opts;

  if (allowHTTP !== true && url.startsWith('http://')) throw new Error(`HTTP URLs are blocked by default. Please use HTTPS, or if not possible, enable the 'allowHTTP' option.`);

  log('starting browser...');

  const Browser = await startBrowser(url, opts);

  if (onLoad) {
    const toRun = `(() => {
      if (window.self !== window.top) return; // inside frame

      (${onLoad.toString()})();
    })();`;

    Browser.page.eval(toRun);

    await Browser.cdp.send(`Page.addScriptToEvaluateOnNewDocument`, {
      source: toRun
    });
  }

  return Browser;
};

export const extensions = {
  add: ExtensionsAPI.add,
  remove: ExtensionsAPI.remove
};