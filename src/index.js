import { join, dirname, delimiter, sep, resolve, isAbsolute } from 'path';
import { access, readdir } from 'fs/promises';
import { fileURLToPath } from 'url';
import { log } from './lib/logger.js';

import Chromium from './browser/chromium.js';
import Firefox from './browser/firefox.js';

import LocalServer from './lib/local/server.js';

process.versions.gluon = '0.12.3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const browserPaths = ({
  win32: process.platform === 'win32' && { // windows paths are automatically prepended with program files, program files (x86), and local appdata if a string, see below
    chrome: [
      join('Google', 'Chrome', 'Application', 'chrome.exe'),
      join(process.env.USERPROFILE, 'scoop', 'apps', 'googlechrome', 'current', 'chrome.exe')
    ],
    chrome_beta: join('Google', 'Chrome Beta', 'Application', 'chrome.exe'),
    chrome_dev: join('Google', 'Chrome Dev', 'Application', 'chrome.exe'),
    chrome_canary: join('Google', 'Chrome SxS', 'Application', 'chrome.exe'),

    chromium: [
      join('Chromium', 'Application', 'chrome.exe'),
      join(process.env.USERPROFILE, 'scoop', 'apps', 'chromium', 'current', 'chrome.exe')
    ],

    edge: join('Microsoft', 'Edge', 'Application', 'msedge.exe'),
    edge_beta: join('Microsoft', 'Edge Beta', 'Application', 'msedge.exe'),
    edge_dev: join('Microsoft', 'Edge Dev', 'Application', 'msedge.exe'),
    edge_canary: join('Microsoft', 'Edge SxS', 'Application', 'msedge.exe'),

    thorium: join('Thorium', 'Application', 'thorium.exe'),
    brave: join('BraveSoftware', 'Brave-Browser', 'Application', 'brave.exe'),

    firefox: [
      join('Mozilla Firefox', 'firefox.exe'),
      join(process.env.USERPROFILE, 'scoop', 'apps', 'firefox', 'current', 'firefox.exe')
    ],
    firefox_developer: join('Firefox Developer Edition', 'firefox.exe'),
    firefox_nightly: join('Firefox Nightly', 'firefox.exe'),

    librewolf: join('LibreWolf', 'librewolf.exe'),
  },

  linux: { // these should be in path so just use the name of the binary
    chrome: [ 'chrome', 'google-chrome', 'chrome-browser', 'google-chrome-stable' ],
    chrome_beta: [ 'chrome-beta', 'google-chrome-beta', 'chrome-beta-browser', 'chrome-browser-beta' ],
    chrome_dev: [ 'chrome-unstable', 'google-chrome-unstable', 'chrome-unstable-browser', 'chrome-browser-unstable' ],
    chrome_canary: [ 'chrome-canary', 'google-chrome-canary', 'chrome-canary-browser', 'chrome-browser-canary' ],

    chromium: [ 'chromium', 'chromium-browser' ],
    chromium_snapshot: [ 'chromium-snapshot', 'chromium-snapshot-bin' ],

    edge: [ 'microsoft-edge', 'microsoft-edge-stable', 'microsoft-edge-browser' ],
    edge_beta: [ 'microsoft-edge-beta', 'microsoft-edge-browser-beta', 'microsoft-edge-beta-browser' ],
    edge_dev: [ 'microsoft-edge-dev', 'microsoft-edge-browser-dev', 'microsoft-edge-dev-browser' ],
    edge_canary: [ 'microsoft-edge-canary', 'microsoft-edge-browser-canary', 'microsoft-edge-canary-browser' ],

    thorium: [ 'thorium', 'thorium-browser' ],
    brave: [ 'brave', 'brave-browser' ],

    firefox: [ 'firefox', 'firefox-browser' ],
    firefox_nightly: [ 'firefox-nightly', 'firefox-nightly-browser', 'firefox-browser-nightly' ],

    librewolf: [ 'librewolf', 'librewolf-browser' ]
  },

  darwin: {
    chrome: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    chrome_beta: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome Beta',
    chrome_dev: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome Dev',
    chrome_canary: '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',

    chromium: '/Applications/Chromium.app/Contents/MacOS/Chromium',

    edge: '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    edge_beta: '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge Beta',
    edge_dev: '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge Dev',
    edge_canary: '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge Canary',

    brave: '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',

    firefox: '/Applications/Firefox.app/Contents/MacOS/firefox',
    firefox_nightly: '/Applications/Firefox Nightly.app/Contents/MacOS/firefox'
  }
})[process.platform];

if (process.platform === 'win32') { // windows: automatically generate env-based paths if not arrays
  for (const browser in browserPaths) {
    const isArray = Array.isArray(browserPaths[browser]);
    const basePath = isArray ? browserPaths[browser][0] : browserPaths[browser];

    browserPaths[browser] = [
      join(process.env.PROGRAMFILES, basePath),
      join(process.env.LOCALAPPDATA, basePath),
      join(process.env['PROGRAMFILES(x86)'], basePath),
      ...(isArray ? browserPaths[browser].slice(1) : [])
    ];
  }
}

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
    // log('checking if ' + browser + ' exists:', path, await exists(path));

    if (await exists(path)) return path;
  }

  return null;
};

const findBrowserPath = async (forceBrowser, forceEngine) => {
  if (forceBrowser) return [ await getBrowserPath(forceBrowser), forceBrowser ];

  for (const x in browserPaths) {
    if (process.argv.includes('--' + x) || process.argv.includes('--' + x.split('_')[0])) return [ await getBrowserPath(x), x ];
  }

  if (process.argv.some(x => x.startsWith('--browser='))) {
    const given = process.argv.find(x => x.startsWith('--browser='));
    const split = given.slice(given.indexOf('=') + 1).split(',');
    const name = split[0];
    const path = split.slice(1).join(',');

    return [ path || await getBrowserPath(name), name ];
  }

  for (const name in browserPaths) {
    const path = await getBrowserPath(name);

    if (path) {
      if (forceEngine && getBrowserType(name) !== forceEngine) continue; // if forceEngine is set, ignore path if it isn't

      return [ path, name ];
    }
  }

  return null;
};

const getFriendlyName = whichBrowser => whichBrowser[0].toUpperCase() + whichBrowser.slice(1).replace(/[a-z]_[a-z]/g, _ => _[0] + ' ' + _[2].toUpperCase());

const ranJsDir = !process.argv[1] ? __dirname : (process.argv[1].endsWith('.js') ? dirname(process.argv[1]) : process.argv[1]);
const getDataPath = browser => join(ranJsDir, 'gluon_data', browser);

const getBrowserType = name => { // todo: not need this
  if (name.startsWith('firefox') ||
    [ 'librewolf' ].includes(name)) return 'firefox';

  return 'chromium';
};

const portRange = [ 10000, 60000 ];
const generatePort = () => (Math.floor(Math.random() * (portRange[1] - portRange[0] + 1)) + portRange[0]);

const startBrowser = async (url, { windowSize, forceBrowser, forceEngine }) => {
  const [ browserPath, browserName ] = await findBrowserPath(forceBrowser, forceEngine);
  const browserFriendlyName = getFriendlyName(browserName);

  if (!browserPath) return log('failed to find a good browser install');

  const dataPath = getDataPath(browserName);
  const browserType = getBrowserType(browserName);

  log('found browser', browserName, `(${browserType} based)`, 'at path:', browserPath);
  log('data path:', dataPath);

  const openingLocal = !url.includes('://');
  const localUrl = browserType === 'firefox' ? `http://localhost:${generatePort()}` : 'https://gluon.local';
  const basePath = isAbsolute(url) ? url : join(ranJsDir, url);

  const closeHandlers = [];
  if (openingLocal && browserType === 'firefox') closeHandlers.push(await LocalServer({ localUrl, url: basePath }));

  const Window = await (browserType === 'firefox' ? Firefox : Chromium)({
    dataPath,
    browserPath
  }, {
    url: openingLocal ? localUrl : url,
    windowSize
  }, {
    browserName: browserFriendlyName,
    url: openingLocal ? basePath : url,
    localUrl,
    openingLocal,
    closeHandlers,
    browserType,
    dataPath
  });

  return Window;
};

export const open = async (url, { windowSize, onLoad, forceBrowser, forceEngine } = {}) => {
  log('starting browser...');

  const Browser = await startBrowser(url, { windowSize, forceBrowser, forceEngine });

  if (onLoad) {
    const toRun = `(() => {
      if (window.self !== window.top) return; // inside frame

      (${onLoad.toString()})();
    })();`;

    Browser.page.eval(toRun);

    await Browser.cdp.send(`Page.enable`);
    await Browser.cdp.send(`Page.addScriptToEvaluateOnNewDocument`, {
      source: toRun
    });
  }

  return Browser;
};