import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { spawn } from 'child_process';

import makeIPCApi from './ipc.js';
import ConnectCDP from './cdp.js';

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

.tabbrowser-tab { /* Stop being able to drag around tab like browser, acts as part of titlebar */
  pointer-events: none;
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

  const CDP = await ConnectCDP({ port: debugPort });

  let pageLoadCallback = () => {}, onWindowMessage = () => {};
  CDP.onMessage(msg => {
    if (msg.method === 'Runtime.bindingCalled' && msg.name === 'gluonSend') onWindowMessage(JSON.parse(msg.payload));
    if (msg.method === 'Page.frameStoppedLoading') pageLoadCallback(msg.params);
    if (msg.method === 'Runtime.executionContextCreated') injectIPC(); // ensure IPC injection again
  });

  log(`connected to CDP over websocket (${debugPort})`);

  const browserInfo = await CDP.sendMessage('Browser.getVersion');
  log('browser:', browserInfo.product);

  await CDP.sendMessage('Runtime.enable');

  /* Runtime.addBinding({
    name: '_gluonSend'
  }); */

  const [ ipcMessageCallback, injectIPC, IPCApi ] = await makeIPCApi({
    browserName,
    browserInfo
  }, {
    evaluate: params => CDP.sendMessage(`Runtime.evaluate`, params),
    addScriptToEvaluateOnNewDocument: params => CDP.sendMessage('Page.addScriptToEvaluateOnNewDocument', params),
    pageLoadPromise: new Promise(res => pageLoadCallback = res)
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

    cdp: {
      send: (method, params) => CDP.sendMessage(method, params, sessionId)
    }
  };
};