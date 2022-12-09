const rgb = (r, g, b, msg) => `\x1b[38;2;${r};${g};${b}m${msg}\x1b[0m`;
const log = (...args) => console.log(`[${rgb(88, 101, 242, 'Gluon')}]`, ...args);

process.versions.gluon = '2.1';

const presets = { // Presets from OpenAsar
  'base': '--autoplay-policy=no-user-gesture-required --disable-features=WinRetrieveSuggestionsOnlyOnDemand,HardwareMediaKeyHandling,MediaSessionService', // Base Discord
  'perf': '--enable-gpu-rasterization --enable-zero-copy --ignore-gpu-blocklist --enable-hardware-overlays=single-fullscreen,single-on-top,underlay --enable-features=EnableDrDc,CanvasOopRasterization,BackForwardCache:TimeToLiveInBackForwardCacheInSeconds/300/should_ignore_blocklists/true/enable_same_site/true,ThrottleDisplayNoneAndVisibilityHiddenCrossOriginIframes,UseSkiaRenderer,WebAssemblyLazyCompilation --disable-features=Vulkan --force_high_performance_gpu', // Performance
  'battery': '--enable-features=TurnOffStreamingMediaCachingOnBattery --force_low_power_gpu', // Known to have better battery life for Chromium?
  'memory': '--in-process-gpu --js-flags="--lite-mode --optimize_for_size --wasm_opt --wasm_lazy_compilation --wasm_lazy_validation --always_compact" --renderer-process-limit=2 --enable-features=QuickIntensiveWakeUpThrottlingAfterLoading' // Less (?) memory usage
};

import { exec } from 'child_process';
import { join, dirname } from 'path';
import { access } from 'fs/promises';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import CDP from 'chrome-remote-interface';

const chromiumPathsWin = {
  stable: join(process.env.PROGRAMFILES, 'Google', 'Chrome', 'Application', 'chrome.exe'),
  canary: join(process.env.LOCALAPPDATA, 'Google', 'Chrome SxS', 'Application', 'chrome.exe'),
  edge: join(process.env['PROGRAMFILES(x86)'], 'Microsoft', 'Edge', 'Application', 'msedge.exe')
};

const exists = path => access(path).then(() => true).catch(() => false);

const findChromiumPath = async () => {
  let whichChromium = '';

  for (const x of [ 'stable', 'canary', 'edge' ]) {
    if (process.argv.includes('--' + x)) whichChromium = x;
  }

  if (!whichChromium) {
    for (const x in chromiumPathsWin) {
      log(x, chromiumPathsWin[x], await exists(chromiumPathsWin[x]));

      if (await exists(chromiumPathsWin[x])) {
        whichChromium = x;
        break;
      }
    }
  }

  if (!whichChromium) return null;

  return chromiumPathsWin[whichChromium];
};

const getDataPath = () => join(__dirname, '..', 'chrome_data');


const startChromium = (url, { windowSize }) => new Promise(async res => {
  const dataPath = getDataPath();
  const chromiumPath = await findChromiumPath();

  log('chromium path:', chromiumPath);
  log('data path:', dataPath);

  if (!chromiumPath) return log('failed to find a good chromium install');

  const debugPort = 9222;

  exec(`"${chromiumPath}" --app=${url} --remote-debugging-port=${debugPort} --user-data-dir="${dataPath}" ${windowSize ? `--window-size=${windowSize.join(',')}` : ''} --new-window --disable-extensions --disable-default-apps --disable-breakpad --disable-crashpad --disable-background-networking --disable-domain-reliability --disable-component-update --disable-sync --disable-features=AutofillServerCommunication ${presets.perf}`, (err, stdout, stderr) => {
    log(err, stdout, stderr);
  });

  setTimeout(() => res(debugPort), 500);
});

export const open = async (url, onLoad = () => {}, { windowSize } = {}) => {
  log('starting chromium...');

  const debugPort = await startChromium(url, { windowSize });
  log('connecting to CDP...');

  const { Runtime, Page } = await CDP({ port: debugPort });

  // const run = async js => (await Runtime.evaluate({ expression: js })).result.value;
  const run = async js => log(await Runtime.evaluate({ expression: js }));

  const toRun = `(() => {
    if (window.self !== window.top) return; // inside frame

    const GLUON_VERSION = '${process.versions.gluon}';
    const NODE_VERSION = '${process.versions.node}';
    const CHROMIUM_VERSION = navigator.userAgentData.brands.find(x => x.brand === "Chromium").version;

    (${onLoad.toString()})();
  })()`;

  run(toRun);

  await Page.enable();
  await Page.addScriptToEvaluateOnNewDocument({ source: toRun });
};
