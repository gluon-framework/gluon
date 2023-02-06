import { join } from 'node:path'

const generateWindowPath = (basePath) => {
  return [
    join(process.env.PROGRAMFILES, basePath),
    join(process.env.LOCALAPPDATA, basePath),
    join(process.env['PROGRAMFILES(x86)'], basePath),
  ]
}

export const getBrowserPaths = (os = process.platform) => { // return Record<string, string[]>
  switch (os) {
    case 'win32': {
      // windows paths are prepended with program files, program files (x86), and local appdata see generateWindowPath
      return {
        chrome: [
          ...generateWindowPath(join('Google', 'Chrome', 'Application', 'chrome.exe')),
          join(process.env.USERPROFILE, 'scoop', 'apps', 'googlechrome', 'current', 'chrome.exe')
        ],
        chrome_beta: join('Google', 'Chrome Beta', 'Application', 'chrome.exe'),
        chrome_dev: join('Google', 'Chrome Dev', 'Application', 'chrome.exe'),
        chrome_canary: join('Google', 'Chrome SxS', 'Application', 'chrome.exe'),

        chromium: [
          ...generateWindowPath(join('Chromium', 'Application', 'chrome.exe')),
          join(process.env.USERPROFILE, 'scoop', 'apps', 'chromium', 'current', 'chrome.exe')
        ],

        edge: generateWindowPath(join('Microsoft', 'Edge', 'Application', 'msedge.exe')),
        edge_beta: generateWindowPath(join('Microsoft', 'Edge Beta', 'Application', 'msedge.exe')),
        edge_dev: generateWindowPath(join('Microsoft', 'Edge Dev', 'Application', 'msedge.exe')),
        edge_canary: generateWindowPath(join('Microsoft', 'Edge SxS', 'Application', 'msedge.exe')),

        thorium: generateWindowPath(join('Thorium', 'Application', 'thorium.exe')),
        brave: generateWindowPath(join('BraveSoftware', 'Brave-Browser', 'Application', 'brave.exe')),
        vivaldi: generateWindowPath(join('Vivaldi', 'Application', 'vivaldi.exe')),

        firefox: [
          ...generateWindowPath(join('Mozilla Firefox', 'firefox.exe')),
          join(process.env.USERPROFILE, 'scoop', 'apps', 'firefox', 'current', 'firefox.exe'),
        ],
        firefox_developer: generateWindowPath(join('Firefox Developer Edition', 'firefox.exe')),
        firefox_nightly: generateWindowPath(join('Firefox Nightly', 'firefox.exe')),

        librewolf: generateWindowPath(join('LibreWolf', 'librewolf.exe')),
        waterfox: generateWindowPath(join('Waterfox', 'waterfox.exe')),
      }
    }
    case 'linux': {
      return { // these should be in path so just use the name of the binary
        chrome: ['chrome', 'google-chrome', 'chrome-browser', 'google-chrome-stable'],
        chrome_beta: ['chrome-beta', 'google-chrome-beta', 'chrome-beta-browser', 'chrome-browser-beta'],
        chrome_dev: ['chrome-unstable', 'google-chrome-unstable', 'chrome-unstable-browser', 'chrome-browser-unstable'],
        chrome_canary: ['chrome-canary', 'google-chrome-canary', 'chrome-canary-browser', 'chrome-browser-canary'],

        chromium: ['chromium', 'chromium-browser'],
        chromium_snapshot: ['chromium-snapshot', 'chromium-snapshot-bin'],

        edge: ['microsoft-edge', 'microsoft-edge-stable', 'microsoft-edge-browser'],
        edge_beta: ['microsoft-edge-beta', 'microsoft-edge-browser-beta', 'microsoft-edge-beta-browser'],
        edge_dev: ['microsoft-edge-dev', 'microsoft-edge-browser-dev', 'microsoft-edge-dev-browser'],
        edge_canary: ['microsoft-edge-canary', 'microsoft-edge-browser-canary', 'microsoft-edge-canary-browser'],

        thorium: ['thorium', 'thorium-browser'],
        brave: ['brave', 'brave-browser'],
        vivaldi: ['vivaldi', 'vivaldi-browser'],

        firefox: ['firefox', 'firefox-browser'],
        firefox_nightly: ['firefox-nightly', 'firefox-nightly-browser', 'firefox-browser-nightly'],

        librewolf: ['librewolf', 'librewolf-browser'],
        waterfox: ['waterfox', 'waterfox-browser'],
      }
    }
    case 'darwin': {
      return {
        chrome: ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'],
        chrome_beta: ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome Beta'],
        chrome_dev: ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome Dev'],
        chrome_canary: ['/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary'],

        chromium: ['/Applications/Chromium.app/Contents/MacOS/Chromium'],

        edge: ['/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge'],
        edge_beta: ['/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge Beta'],
        edge_dev: ['/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge Dev'],
        edge_canary: ['/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge Canary'],

        thorium: ['/Applications/Thorium.app/Contents/MacOS/Thorium'],
        brave: ['/Applications/Brave Browser.app/Contents/MacOS/Brave Browser'],
        vivaldi: ['/Applications/Vivaldi.app/Contents/MacOS/Vivaldi'],

        firefox: ['/Applications/Firefox.app/Contents/MacOS/firefox'],
        firefox_nightly: ['/Applications/Firefox Nightly.app/Contents/MacOS/firefox'],

        librewolf: ['/Applications/LibreWolf.app/Contents/MacOS/librewolf'],
        waterfox: ['/Applications/Waterfox.app/Contents/MacOS/waterfox'],
      }
    }
    default: {
      throw new Error(`Your OS "${os}" is not compatible with Gluon`)
    }
  }
}