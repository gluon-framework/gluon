const rgb = (r, g, b, msg) => `\x1b[38;2;${r};${g};${b}m${msg}\x1b[0m`;
window.log = (...args) => console.log(`[${rgb(88, 101, 242, 'Gluon')}]`, ...args);

Deno.version = { // have to do this because... Deno
  ...Deno.version,
  gluon: '0.10.0-deno'
};

import { join, dirname, delimiter, sep } from 'https://deno.land/std@0.170.0/node/path.ts';
import { access, readdir } from 'https://deno.land/std@0.170.0/node/fs/promises.ts';
import { fileURLToPath } from 'https://deno.land/std@0.170.0/node/url.ts';

import Chromium from './browser/chromium.js';
import Firefox from './browser/firefox.js';


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const browserPaths = ({
  windows: Deno.build.os === 'windows' && { // windows paths are automatically prepended with program files, program files (x86), and local appdata if a string, see below
    chrome: join('Google', 'Chrome', 'Application', 'chrome.exe'),
    chrome_beta: join('Google', 'Chrome Beta', 'Application', 'chrome.exe'),
    chrome_dev: join('Google', 'Chrome Dev', 'Application', 'chrome.exe'),
    chrome_canary: join('Google', 'Chrome SxS', 'Application', 'chrome.exe'),

    chromium: join('Chromium', 'Application', 'chrome.exe'),

    edge: join('Microsoft', 'Edge', 'Application', 'msedge.exe'),
    edge_beta: join('Microsoft', 'Edge Beta', 'Application', 'msedge.exe'),
    edge_dev: join('Microsoft', 'Edge Dev', 'Application', 'msedge.exe'),
    edge_canary: join('Microsoft', 'Edge SxS', 'Application', 'msedge.exe'),

    thorium: join('Thorium', 'Application', 'thorium.exe'),
    brave: join('BraveSoftware', 'Brave-Browser', 'Application', 'brave.exe'),

    firefox: join('Mozilla Firefox', 'firefox.exe'),
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
})[Deno.build.os];

if (Deno.build.os === 'windows') { // windows: automatically generate env-based paths if not arrays
  for (const browser in browserPaths) {
    if (!Array.isArray(browserPaths[browser])) {
      const basePath = browserPaths[browser];

      browserPaths[browser] = [
        join(Deno.env.get('PROGRAMFILES'), basePath),
        join(Deno.env.get('LOCALAPPDATA'), basePath),
        join(Deno.env.get('PROGRAMFILES(x86)'), basePath)
      ];
    }
  }
}

let _binariesInPath; // cache as to avoid excessive reads
const getBinariesInPath = async () => {
  if (_binariesInPath) return _binariesInPath;

  return _binariesInPath = (await Promise.all(Deno.env.get('PATH')
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

const findBrowserPath = async (forceBrowser) => {
  if (forceBrowser) return [ await getBrowserPath(forceBrowser), forceBrowser ];

  for (const x in browserPaths) {
    if (Deno.args.includes('--' + x) || Deno.args.includes('--' + x.split('_')[0])) return [ await getBrowserPath(x), x ];
  }

  for (const x in browserPaths) {
    const path = await getBrowserPath(x);

    if (path) return [ path, x ];
  }

  return null;
};

const getFriendlyName = whichBrowser => whichBrowser[0].toUpperCase() + whichBrowser.slice(1).replace(/[a-z]_[a-z]/g, _ => _[0] + ' ' + _[2].toUpperCase());

const ranJsDir = !Deno.args[0] ? __dirname : (Deno.args[0].endsWith('.js') ? dirname(Deno.args[0]) : Deno.args[0]);
const getDataPath = browser => join(ranJsDir, 'gluon_data', browser);

const getBrowserType = name => { // todo: not need this
  if (name.startsWith('firefox') ||
    [ 'librewolf' ].includes(name)) return 'firefox';

  return 'chromium';
};

const startBrowser = async (url, { windowSize, forceBrowser }) => {
  const [ browserPath, browserName ] = await findBrowserPath(forceBrowser);
  const browserFriendlyName = getFriendlyName(browserName);

  if (!browserPath) return log('failed to find a good browser install');

  const dataPath = getDataPath(browserName);
  const browserType = getBrowserType(browserName);

  log('found browser', browserName, `(${browserType} based)`, 'at path:', browserPath);
  log('data path:', dataPath);

  const Window = await (browserType === 'firefox' ? Firefox : Chromium)({
    browserName: browserFriendlyName,
    dataPath,
    browserPath
  }, {
    url,
    windowSize
  });

  return Window;
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
