const rgb = (r, g, b, msg) => `\x1b[38;2;${r};${g};${b}m${msg}\x1b[0m`;
window.log = (...args) => console.log(`[${rgb(88, 101, 242, 'Gluon')}]`, ...args);

Deno.version = { // have to do this because... Deno
  ...Deno.version,
  gluon: '0.9.0-deno-dev'
};

import { join, dirname, delimiter, sep } from 'https://deno.land/std@0.170.0/node/path.ts';
import { access, readdir } from 'https://deno.land/std@0.170.0/node/fs/promises.ts';
import { fileURLToPath } from 'https://deno.land/std@0.170.0/node/url.ts';

import Chromium from './browser/chromium.js';
import Firefox from './browser/firefox.js';

import IdleAPI from './api/idle.js';
import ControlsAPI from './api/controls.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const browserPaths = ({
  windows: Deno.build.os === 'windows' && {
    chrome: join(Deno.env.get('PROGRAMFILES'), 'Google', 'Chrome', 'Application', 'chrome.exe'),
    chrome_canary: join(Deno.env.get('LOCALAPPDATA'), 'Google', 'Chrome SxS', 'Application', 'chrome.exe'),
    edge: join(Deno.env.get('PROGRAMFILES(x86)'), 'Microsoft', 'Edge', 'Application', 'msedge.exe'),

    firefox: join(Deno.env.get('PROGRAMFILES'), 'Mozilla Firefox', 'firefox.exe'),
    firefox_nightly: join(Deno.env.get('PROGRAMFILES'), 'Firefox Nightly', 'firefox.exe'),
  },

  linux: { // these should be in path so just use the name of the binary
    chrome: [ 'chrome', 'google-chrome', 'chrome-browser', 'google-chrome-stable' ],
    chrome_canary: [ 'chrome-canary', 'google-chrome-canary', 'google-chrome-unstable', 'chrome-unstable' ],

    chromium: [ 'chromium', 'chromium-browser' ],
    chromium_snapshot: [ 'chromium-snapshot', 'chromium-snapshot-bin' ],

    firefox: 'firefox',
    firefox_nightly: 'firefox-nightly'
  },

  darwin: {
    chrome: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    chrome_canary: '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
    edge: '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',

    chromium: '/Applications/Chromium.app/Contents/MacOS/Chromium',

    firefox: '/Applications/Firefox.app/Contents/MacOS/firefox',
    firefox_nightly: '/Applications/Firefox Nightly.app/Contents/MacOS/firefox'
  }
})[Deno.build.os];

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
    log('checking if ' + browser + ' exists:', path, await exists(path));

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
const getDataPath = () => join(__dirname, '..', 'chrome_data');

const startBrowser = async (url, { windowSize, forceBrowser }) => {
  const dataPath = getDataPath();

  const [ browserPath, browserName ] = await findBrowserPath(forceBrowser);

  const browserFriendlyName = getFriendlyName(browserName);

  log('browser path:', browserPath);
  log('data path:', dataPath);

  if (!browserPath) return log('failed to find a good browser install');

  const browserType = browserName.startsWith('firefox') ? 'firefox' : 'chromium';

  const Window = await (browserType === 'firefox' ? Firefox : Chromium)({
    browserName: browserFriendlyName,
    dataPath,
    browserPath
  }, {
    url,
    windowSize
  });

  Window.idle = await IdleAPI(Window.cdp, { browserType });
  Window.controls = await ControlsAPI(Window.cdp);

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
