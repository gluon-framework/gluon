import { join } from 'path';

import StartBrowser from '../launcher/start.js';

const presets = { // Presets from OpenAsar
  'base': '--autoplay-policy=no-user-gesture-required --disable-features=WinRetrieveSuggestionsOnlyOnDemand,HardwareMediaKeyHandling,MediaSessionService', // Base
  'perf': '--enable-gpu-rasterization --enable-zero-copy --ignore-gpu-blocklist --enable-hardware-overlays=single-fullscreen,single-on-top,underlay --enable-features=EnableDrDc,CanvasOopRasterization,BackForwardCache:TimeToLiveInBackForwardCacheInSeconds/300/should_ignore_blocklists/true/enable_same_site/true,ThrottleDisplayNoneAndVisibilityHiddenCrossOriginIframes,UseSkiaRenderer,WebAssemblyLazyCompilation --disable-features=Vulkan', // Performance
  'battery': '--enable-features=TurnOffStreamingMediaCachingOnBattery --force_low_power_gpu', // Known to have better battery life for Chromium?
  'memory': '--in-process-gpu --js-flags="--lite-mode --optimize_for_size --wasm_opt --wasm_lazy_compilation --wasm_lazy_validation --always_compact" --renderer-process-limit=2 --enable-features=QuickIntensiveWakeUpThrottlingAfterLoading' // Less (?) memory usage
};

export default async ({ browserPath, dataPath }, { url, windowSize, allowHTTP, extensions, devtools, userAgent }, extra) => {
  if (!devtools) {
    (async () => {
      const fs = await import('fs/promises');

      fs.writeFile(join(dataPath, 'devtools_app.html'), `<h1>DevTools is disabled</h1><style>html, body { background: rgb(32, 33, 36); } h1 { color: rgb(154, 160, 166); font-family: 'Segoe UI', Tahoma, sans-serif; font-size: 1.6em; font-weight: normal; } body { display: flex; align-items: center; justify-content: center; }</style><title>DevTools (disabled)</title>`);
    })();
  }

  return await StartBrowser(browserPath, [
    `--app=${url}`,
    `--user-data-dir=${dataPath}`,
    !devtools ? `--custom-devtools-frontend=${(await import('url')).pathToFileURL(dataPath)}` : '',
    userAgent ? `--user-agent="${userAgent}"` : '',
    windowSize ? `--window-size=${windowSize.join(',')}` : '',
    ![true, 'mixed'].includes(allowHTTP) ? `--enable-strict-mixed-content-checking` : '--allow-running-insecure-content',
    Array.isArray(extensions) && extensions.length > 0 ? `--load-extension=${(await Promise.all(extensions)).flat().join(',')}` : '',
    ...`--new-window --autoplay-policy=no-user-gesture-required --disable-translate --disable-popup-blocking --disable-sync --no-first-run --no-default-browser-check --disable-component-extensions-with-background-pages --disable-default-apps --disable-breakpad --disable-crashpad --disable-background-networking --disable-domain-reliability --disable-component-update --disable-sync --disable-features=AutofillServerCommunication ${presets.perf}`.split(' ')
  ], 'stdio', extra);
};