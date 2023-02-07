import { afterAll, beforeAll, beforeEach, describe, expect, test } from 'vitest'

import { getBrowserPaths } from './browserPaths'

describe('getBrowserPaths', () => {
  describe('unknow', () => {
    test('should crash', () => {
      expect(() => getBrowserPaths('honk')).toThrowError('Your OS "honk" is not compatible with Gluon')
    })
  })

  describe('win32', () => {
    let OLD_ENV

    beforeAll(() => {
      OLD_ENV = process.env // Make a copy
    })

    beforeEach(() => {
      process.env = {
        ...OLD_ENV,
        PROGRAMFILES: 'PROGRAMFILES',
        LOCALAPPDATA: 'LOCALAPPDATA',
        'PROGRAMFILES(x86)': 'PROGRAMFILES(x86)',
        USERPROFILE: 'USERPROFILE'
      }
    })

    afterAll(() => {
      process.env = OLD_ENV // Restore old environment
    })

    test('should return', () => {
      expect(getBrowserPaths('win32')).toEqual({
          'chrome': ['PROGRAMFILES\\Google\\Chrome\\Application\\chrome.exe', 'LOCALAPPDATA\\Google\\Chrome\\Application\\chrome.exe', 'PROGRAMFILES(x86)\\Google\\Chrome\\Application\\chrome.exe', 'USERPROFILE\\scoop\\apps\\googlechrome\\current\\chrome.exe'],
          'chrome_beta': 'Google\\Chrome Beta\\Application\\chrome.exe',
          'chrome_dev': 'Google\\Chrome Dev\\Application\\chrome.exe',
          'chrome_canary': 'Google\\Chrome SxS\\Application\\chrome.exe',
          'chromium': ['PROGRAMFILES\\Chromium\\Application\\chrome.exe', 'LOCALAPPDATA\\Chromium\\Application\\chrome.exe', 'PROGRAMFILES(x86)\\Chromium\\Application\\chrome.exe', 'USERPROFILE\\scoop\\apps\\chromium\\current\\chrome.exe'],
          'edge': ['PROGRAMFILES\\Microsoft\\Edge\\Application\\msedge.exe', 'LOCALAPPDATA\\Microsoft\\Edge\\Application\\msedge.exe', 'PROGRAMFILES(x86)\\Microsoft\\Edge\\Application\\msedge.exe'],
          'edge_beta': ['PROGRAMFILES\\Microsoft\\Edge Beta\\Application\\msedge.exe', 'LOCALAPPDATA\\Microsoft\\Edge Beta\\Application\\msedge.exe', 'PROGRAMFILES(x86)\\Microsoft\\Edge Beta\\Application\\msedge.exe'],
          'edge_dev': ['PROGRAMFILES\\Microsoft\\Edge Dev\\Application\\msedge.exe', 'LOCALAPPDATA\\Microsoft\\Edge Dev\\Application\\msedge.exe', 'PROGRAMFILES(x86)\\Microsoft\\Edge Dev\\Application\\msedge.exe'],
          'edge_canary': ['PROGRAMFILES\\Microsoft\\Edge SxS\\Application\\msedge.exe', 'LOCALAPPDATA\\Microsoft\\Edge SxS\\Application\\msedge.exe', 'PROGRAMFILES(x86)\\Microsoft\\Edge SxS\\Application\\msedge.exe'],
          'thorium': ['PROGRAMFILES\\Thorium\\Application\\thorium.exe', 'LOCALAPPDATA\\Thorium\\Application\\thorium.exe', 'PROGRAMFILES(x86)\\Thorium\\Application\\thorium.exe'],
          'brave': ['PROGRAMFILES\\BraveSoftware\\Brave-Browser\\Application\\brave.exe', 'LOCALAPPDATA\\BraveSoftware\\Brave-Browser\\Application\\brave.exe', 'PROGRAMFILES(x86)\\BraveSoftware\\Brave-Browser\\Application\\brave.exe'],
          'vivaldi': ['PROGRAMFILES\\Vivaldi\\Application\\vivaldi.exe', 'LOCALAPPDATA\\Vivaldi\\Application\\vivaldi.exe', 'PROGRAMFILES(x86)\\Vivaldi\\Application\\vivaldi.exe'],
          'firefox': ['PROGRAMFILES\\Mozilla Firefox\\firefox.exe', 'LOCALAPPDATA\\Mozilla Firefox\\firefox.exe', 'PROGRAMFILES(x86)\\Mozilla Firefox\\firefox.exe', 'USERPROFILE\\scoop\\apps\\firefox\\current\\firefox.exe'],
          'firefox_developer': ['PROGRAMFILES\\Firefox Developer Edition\\firefox.exe', 'LOCALAPPDATA\\Firefox Developer Edition\\firefox.exe', 'PROGRAMFILES(x86)\\Firefox Developer Edition\\firefox.exe'],
          'firefox_nightly': ['PROGRAMFILES\\Firefox Nightly\\firefox.exe', 'LOCALAPPDATA\\Firefox Nightly\\firefox.exe', 'PROGRAMFILES(x86)\\Firefox Nightly\\firefox.exe'],
          'librewolf': ['PROGRAMFILES\\LibreWolf\\librewolf.exe', 'LOCALAPPDATA\\LibreWolf\\librewolf.exe', 'PROGRAMFILES(x86)\\LibreWolf\\librewolf.exe'],
          'waterfox': ['PROGRAMFILES\\Waterfox\\waterfox.exe', 'LOCALAPPDATA\\Waterfox\\waterfox.exe', 'PROGRAMFILES(x86)\\Waterfox\\waterfox.exe']
        }
      )
    })
  })

  test('linux', () => {
    expect(getBrowserPaths('linux')).toEqual({
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
      waterfox: ['waterfox', 'waterfox-browser']
    })
  })

  test('darwin', () => {
    console.log(getBrowserPaths('darwin'))
    expect(getBrowserPaths('darwin')).toEqual({
      chrome: [ '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' ],
      chrome_beta: ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome Beta'],
      chrome_dev: ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome Dev'],
      chrome_canary: ['/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary'],
      chromium: [ '/Applications/Chromium.app/Contents/MacOS/Chromium' ],
      edge: [ '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge' ],
      edge_beta: ['/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge Beta'],
      edge_dev: ['/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge Dev'],
      edge_canary: ['/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge Canary'],
      thorium: [ '/Applications/Thorium.app/Contents/MacOS/Thorium' ],
      brave: [ '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser' ],
      vivaldi: [ '/Applications/Vivaldi.app/Contents/MacOS/Vivaldi' ],
      firefox: [ '/Applications/Firefox.app/Contents/MacOS/firefox' ],
      firefox_nightly: [ '/Applications/Firefox Nightly.app/Contents/MacOS/firefox' ],
      librewolf: [ '/Applications/LibreWolf.app/Contents/MacOS/librewolf' ],
      waterfox: [ '/Applications/Waterfox.app/Contents/MacOS/waterfox' ]
    })
  })
})
