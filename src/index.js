import { join, dirname, extname, isAbsolute } from 'path';

import { fileURLToPath } from 'url';
import { log, dangerousAPI } from './lib/logger.js';

import Chromium from './browser/chromium.js';
import Firefox from './browser/firefox.js';

import * as ExtensionsAPI from './extensions.js';
import LocalHTTP from './lib/local/http.js';
import { findBrowserPath, getBrowserType } from './lib/browserPaths.js';

process.versions.gluon = '0.14.0-alpha.0';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const getFriendlyName = whichBrowser => whichBrowser[0].toUpperCase() + whichBrowser.slice(1).replace(/[a-z]_[a-z]/g, _ => _[0] + ' ' + _[2].toUpperCase());

const ranJsDir = !process.argv[1] ? __dirname : (extname(process.argv[1]) ? dirname(process.argv[1]) : process.argv[1]);
const getDataPath = browser => join(ranJsDir, 'gluon_data', browser);

const portRange = [ 10000, 60000 ];
const generatePort = () => (Math.floor(Math.random() * (portRange[1] - portRange[0] + 1)) + portRange[0]);

// default CSP policy. tl;dr: allow everything if same-origin, and allow all mostly non-dangerous things for all domains (images, css, requests)
const defaultCSP = [ 'upgrade-insecure-requests' ].concat(
  [ 'default-src' ].map(x => `${x} 'self' 'unsafe-inline'`)
).concat(
  [ 'connect-src', 'prefetch-src', 'font-src', 'img-src', 'media-src', 'style-src', 'form-action' ].map(x => `${x} https: data: blob: 'unsafe-inline'`)
).join('; ');

const startBrowser = async (url, parentDir, { allowHTTP = false, allowNavigation = 'same-origin', windowSize, forceBrowser, forceEngine, localCSP = defaultCSP, devtools, userAgent }) => {
  const [ browserPath, browserName ] = await findBrowserPath(forceBrowser, forceEngine);
  const browserFriendlyName = getFriendlyName(browserName);

  if (!browserPath) return log('failed to find a good browser install');

  const dataPath = getDataPath(browserName);
  const browserType = getBrowserType(browserName);

  log('found browser', browserName, `(${browserType} based)`, 'at path:', browserPath);
  log('data path:', dataPath);

  const openingLocal = !url.includes('://') && !url.includes('data:');
  const localUrl = browserType === 'firefox' ? `http://localhost:${generatePort()}` : 'https://app.gluon';
  const basePath = isAbsolute(url) ? url : join(parentDir, url);

  const closeHandlers = [];
  if (openingLocal && browserType === 'firefox') closeHandlers.push(await LocalHTTP({ url: localUrl, basePath, csp: localCSP }));

  const Window = await (browserType === 'firefox' ? Firefox : Chromium)({
    dataPath,
    browserPath
  }, {
    url: openingLocal ? localUrl : url,
    windowSize,
    allowHTTP,
    extensions: ExtensionsAPI._extensions[browserType],
    devtools: devtools === false ? process.argv.includes('--enable-devtools') : true,
    userAgent
  }, {
    browserName: browserFriendlyName,
    url: openingLocal ? localUrl : url,
    basePath,
    openingLocal,
    closeHandlers,
    browserType,
    dataPath,
    allowNavigation,
    localCSP
  });

  return Window;
};

// get parent directory of where function was called from
const getParentDir = () => {
  let place = (new Error()).stack.split('\n')[3].slice(7).trim().split(':').slice(0, -2).join(':');
  if (place.startsWith('file://')) place = fileURLToPath(place);
  return dirname(place);
};

const checkForDangerousOptions = ({ allowHTTP, allowNavigation, localCSP }) => {
  if (allowHTTP === true) dangerousAPI('Gluon.open', 'allowHTTP', 'true');
  if (allowNavigation === true) dangerousAPI('Gluon.open', 'allowNavigation', 'true');
  if (localCSP === '') dangerousAPI('Gluon.open', 'localCSP', '\'\'');
};

export const open = async (url, opts = {}) => {
  const { allowHTTP = false } = opts;

  if (allowHTTP !== true && url.startsWith('http://')) throw new Error(`HTTP URLs are blocked by default. Please use HTTPS, or if not possible, enable the 'allowHTTP' option.`);

  checkForDangerousOptions(opts);
  log('starting browser...');

  const Browser = await startBrowser(url, getParentDir(), opts);

  return Browser;
};

export const extensions = {
  add: ExtensionsAPI.add,
  remove: ExtensionsAPI.remove
};