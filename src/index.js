const rgb = (r, g, b, msg) => `\x1b[38;2;${r};${g};${b}m${msg}\x1b[0m`;
global.log = (...args) => console.log(`[${rgb(88, 101, 242, 'Gluon')}]`, ...args);

process.versions.gluon = '0.9.0-alpha.0';

import { join, dirname, delimiter, sep } from 'path';
import { access, readdir } from 'fs/promises';
import { fileURLToPath } from 'url';

import Chromium from './browser/chromium.js';
import Firefox from './browser/firefox.js';

import IdleAPI from './lib/idle.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const browserPaths = ({
  win32: process.platform === 'win32' && {
    chrome: join(process.env.PROGRAMFILES, 'Google', 'Chrome', 'Application', 'chrome.exe'),
    chrome_canary: join(process.env.LOCALAPPDATA, 'Google', 'Chrome SxS', 'Application', 'chrome.exe'),
    edge: join(process.env['PROGRAMFILES(x86)'], 'Microsoft', 'Edge', 'Application', 'msedge.exe'),

    firefox: join(process.env.PROGRAMFILES, 'Mozilla Firefox', 'firefox.exe'),
    firefox_nightly: join(process.env.PROGRAMFILES, 'Firefox Nightly', 'firefox.exe'),
  },

  linux: { // these should be in path so just use the name of the binary
    chrome: [ 'chrome', 'google-chrome', 'chrome-browser', 'google-chrome-stable' ],
    chrome_canary: [ 'chrome-canary', 'google-chrome-canary', 'google-chrome-unstable', 'chrome-unstable' ],

    chromium: [ 'chromium', 'chromium-browser' ],
    chromium_snapshot: [ 'chromium-snapshot', 'chromium-snapshot-bin' ],

    firefox: 'firefox',
    firefox_nightly: 'firefox-nightly'
  }
})[process.platform];

let _binariesInPath; // cache as to avoid excessive reads
const getBinariesInPath = async () => {
  if (_binariesInPath) return _binariesInPath;

  return _binariesInPath = (await Promise.all(process.env.PATH
    .replaceAll('"', '')
    .split(delimiter)
    .filter(Boolean)
    .map(x => readdir(x.replace(/"+/g, '')).catch(() => [])))).flat();
};

const exists = async path => {
  if (path.includes(sep)) return await access(path).then(() => true).catch(() => false);

  // just binary name, so check path
  return (await getBinariesInPath()).includes(path);
};

const getBrowserPath = async browser => {
  for (const path of Array.isArray(browserPaths[browser]) ? browserPaths[browser] : [ browserPaths[browser] ]) {
    log('checking if ' + browser + ' exists:', path, await exists(path));

    if (await exists(path)) return path;
  }

  return null;
};

const findBrowserPath = async (forceBrowser) => {
  if (forceBrowser) return [ await getBrowserPath(forceBrowser), forceBrowser ];

  for (const x in browserPaths) {
    if (process.argv.includes('--' + x) || process.argv.includes('--' + x.split('_')[0])) return [ await getBrowserPath(x), x ];
  }

  for (const x in browserPaths) {
    const path = await getBrowserPath(x);

    if (path) return [ path, x ];
  }

  return null;
};

const getFriendlyName = whichBrowser => whichBrowser[0].toUpperCase() + whichBrowser.slice(1).replace(/[a-z]_[a-z]/g, _ => _[0] + ' ' + _[2].toUpperCase());
const getDataPath = () => join(__dirname, '..', 'chrome_data');

const startBrowser = async (url, { windowSize, forceBrowser }) => {
  const dataPath = getDataPath();

  const [ browserPath, browserName ] = await findBrowserPath(forceBrowser);

  const browserFriendlyName = getFriendlyName(browserName);

  log('browser path:', browserPath);
  log('data path:', dataPath);

  if (!browserPath) return log('failed to find a good browser install');

  const browserType = browserName.startsWith('firefox') ? 'firefox' : 'chromium';

  const Browser = await (browserType === 'firefox' ? Firefox : Chromium)({
    browserName: browserFriendlyName,
    dataPath,
    browserPath
  }, {
    url,
    windowSize
  });

  Browser.idle = await IdleAPI(Browser.cdp, { browserType });

  return Browser;
};

export const open = async (url, { windowSize, onLoad, forceBrowser } = {}) => {
  log('starting browser...');

  const Browser = await startBrowser(url, { windowSize, forceBrowser });

  if (onLoad) {
    const toRun = `(() => {
      if (window.self !== window.top) return; // inside frame

      (${onLoad.toString()})();
    })();`;

    Browser.window.eval(toRun);

    await Browser.cdp.send(`Page.enable`);
    await Browser.cdp.send(`Page.addScriptToEvaluateOnNewDocument`, {
      source: toRun
    });
  }

  return Browser;
};