import { mkdir, writeFile, copyFile, access } from 'fs/promises';
import { join, basename } from 'path';

import StartBrowser from '../launcher/start.js';

const exists = path => access(path).then(() => true).catch(() => false);

export default async ({ browserPath, dataPath }, { url, windowSize, allowHTTP, extensions }, extra) => {
  await mkdir(dataPath, { recursive: true });
  await writeFile(join(dataPath, 'user.js'), `
user_pref("toolkit.legacyUserProfileCustomizations.stylesheets", true);
user_pref('devtools.chrome.enabled', true);
user_pref('devtools.debugger.prompt-connection', false);
user_pref('devtools.debugger.remote-enabled', true);
user_pref('toolkit.telemetry.reportingpolicy.firstRun', false);
user_pref('browser.shell.checkDefaultBrowser', false);
${!windowSize ? '' : `user_pref('privacy.window.maxInnerWidth', ${windowSize[0]});
user_pref('privacy.window.maxInnerHeight', ${windowSize[1]});`}
user_pref('privacy.resistFingerprinting', true);
user_pref('fission.bfcacheInParent', false);
user_pref('fission.webContentIsolationStrategy', 0);
user_pref('ui.key.menuAccessKeyFocuses', false);
${process.platform === 'darwin' ? `user_pref('browser.tabs.inTitlebar', 0);` : `` }

user_pref('security.mixed_content.block_active_content', ${![true, 'mixed'].includes(allowHTTP) ? 'true' : 'false'});
user_pref('security.mixed_content.block_display_content', ${![true, 'mixed'].includes(allowHTTP) ? 'true' : 'false'});
user_pref('security.mixed_content.block_object_subrequest', ${![true, 'mixed'].includes(allowHTTP) ? 'true' : 'false'});
user_pref('security.mixed_content.upgrade_display_content', true);
`);

// user_pref('privacy.resistFingerprinting', false);
/* user_pref('privacy.window.maxInnerWidth', ${windowSize[0]});
user_pref('privacy.window.maxInnerHeight', ${windowSize[1]}); */

  await mkdir(join(dataPath, 'chrome'));
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

  await mkdir(join(dataPath, 'extensions'));
  for (const ext of (await Promise.all(extensions)).flat()) {
    const installPath = join(dataPath, 'extensions', basename(ext));
    if (!await exists(installPath)) await copyFile(ext, installPath);
  }

  return await StartBrowser(browserPath, [
    ...(!windowSize ? [] : [ `-window-size`, windowSize.join(',') ]),
    `-profile`, dataPath,
    `-new-window`, url,
    `-new-instance`,
    `-no-remote`,
  ], 'websocket', extra);
};