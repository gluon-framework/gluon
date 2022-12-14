import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { spawn } from 'child_process';

let CDP;
try {
  CDP = (await import('chrome-remote-interface')).default;
} catch {
  console.warn('Dependencies for Firefox are not installed!');
}

import makeIPCApi from './ipc.js';

const portRange = [ 10000, 60000 ];

export default async ({ browserName, browserPath, dataPath }, { url, windowSize }) => {
  const debugPort = Math.floor(Math.random() * (portRange[1] - portRange[0] + 1)) + portRange[0];

  await mkdir(dataPath, { recursive: true });
  await writeFile(join(dataPath, 'user.js'), `
user_pref("toolkit.legacyUserProfileCustomizations.stylesheets", true);
user_pref('devtools.chrome.enabled', true);
user_pref('devtools.debugger.prompt-connection', false);
user_pref('devtools.debugger.remote-enabled', true);
user_pref('toolkit.telemetry.reportingpolicy.firstRun', false);
user_pref('browser.shell.checkDefaultBrowser', false);
user_pref('privacy.window.maxInnerWidth', ${windowSize[0]});
user_pref('privacy.window.maxInnerHeight', ${windowSize[1]});
user_pref('privacy.resistFingerprinting', true);
user_pref('fission.bfcacheInParent', false);
user_pref('fission.webContentIsolationStrategy', 0);
`);

// user_pref('privacy.resistFingerprinting', false);
/* user_pref('privacy.window.maxInnerWidth', ${windowSize[0]});
user_pref('privacy.window.maxInnerHeight', ${windowSize[1]}); */

  await mkdir(join(dataPath, 'chrome'), { recursive: true });
  await writeFile(join(dataPath, 'chrome', 'userChrome.css'), `
.titlebar-spacer, #firefox-view-button, #alltabs-button, #tabbrowser-arrowscrollbox-periphery, .tab-close-button {
  display: none;
}

#nav-bar, #urlbar-container, #searchbar { visibility: collapse !important; }

.tab-background, .tab-content, #tabbrowser-tabs {
  background: none !important;
  margin: 0 !important;
  padding: 0 !important;
  border: none !important;
  box-shadow: none !important;
}

#tabbrowser-tabs {
  margin: 0 6px !important;
}

.tab-icon-image {
  width: 16px;
  height: 16px;
}

#titlebar, .tabbrowser-tab {
  height: 20px;
}

.tab-content {
  height: 42px;
}

html:not([tabsintitlebar="true"]) #titlebar,
html:not([tabsintitlebar="true"]) .tabbrowser-tab,
html:not([tabsintitlebar="true"]) .tab-background,
html:not([tabsintitlebar="true"]) .tab-content,
html:not([tabsintitlebar="true"]) #tabbrowser-tabs,
html:not([tabsintitlebar="true"]) .tab-icon-image {
  display: none !important;
}
`);

  const proc = spawn(browserPath, [
    `--remote-debugging-port=${debugPort}`,
    `-window-size`, windowSize.join(','),
    `-profile`, dataPath,
    `-new-window`, url,
    `-new-instance`,
    `-no-remote`
  ].filter(x => x), {
    detached: false,
    stdio: ['ignore', 'pipe', 'pipe', 'pipe', 'pipe']
  });

  proc.stdout.pipe(proc.stdout);
  proc.stderr.pipe(proc.stderr);

  log(`connecting to CDP over websocket (${debugPort})...`);

  let CDPInstance;
  const connect = async () => {
    try {
      CDPInstance = await CDP({
        port: debugPort
      });
    } catch {
      await new Promise(res => setTimeout(res));
      await connect();
    }
  };

  await connect();

  log(`connected to CDP over websocket (${debugPort})`);

  const { Browser, Runtime, Page } = CDPInstance;

  const browserInfo = await Browser.getVersion();
  log('browser:', browserInfo.product);

  await Runtime.enable();

  /* Runtime.addBinding({
    name: '_gluonSend'
  }); */

  const [ ipcMessageCallback, injectIPC, IPCApi ] = await makeIPCApi({
    browserName,
    browserInfo
  }, {
    evaluate: Runtime.evaluate,
    addScriptToEvaluateOnNewDocument: Page.addScriptToEvaluateOnNewDocument,
    pageLoadPromise: new Promise(res => Page.frameStoppedLoading(res))
  });

  // todo: IPC Node -> Web for Firefox

  log('finished setup');

  return {
    window: {
      eval:  async func => {
        return await Runtime.evaluate({
          expression: typeof func === 'string' ? func : `(${func.toString()})()`
        });
      }
    },

    ipc: IPCApi,

    cdp: { // todo: public CDP API for Firefox
      send: () => {}
    }
  };
};