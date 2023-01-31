import StartBrowser from '../launcher/start.js';

const presets = { // Presets from OpenAsar
  'base': '--autoplay-policy=no-user-gesture-required --disable-features=WinRetrieveSuggestionsOnlyOnDemand,HardwareMediaKeyHandling,MediaSessionService', // Base Discord
  'perf': '--enable-gpu-rasterization --enable-zero-copy --ignore-gpu-blocklist --enable-hardware-overlays=single-fullscreen,single-on-top,underlay --enable-features=EnableDrDc,CanvasOopRasterization,BackForwardCache:TimeToLiveInBackForwardCacheInSeconds/300/should_ignore_blocklists/true/enable_same_site/true,ThrottleDisplayNoneAndVisibilityHiddenCrossOriginIframes,UseSkiaRenderer,WebAssemblyLazyCompilation --disable-features=Vulkan --force_high_performance_gpu', // Performance
  'battery': '--enable-features=TurnOffStreamingMediaCachingOnBattery --force_low_power_gpu', // Known to have better battery life for Chromium?
  'memory': '--in-process-gpu --js-flags="--lite-mode --optimize_for_size --wasm_opt --wasm_lazy_compilation --wasm_lazy_validation --always_compact" --renderer-process-limit=2 --enable-features=QuickIntensiveWakeUpThrottlingAfterLoading' // Less (?) memory usage
};

export default async ({ browserPath, dataPath }, { url, windowSize, allowHTTP }, extra) => {
  return await StartBrowser(browserPath, [
    `--app=${url}`,
    `--remote-debugging-pipe`,
    `--user-data-dir=${dataPath}`,
    windowSize ? `--window-size=${windowSize.join(',')}` : '',
    ![true, 'mixed'].includes(allowHTTP) ? `--enable-strict-mixed-content-checking` : '--allow-running-insecure-content',
    ...`--new-window --no-first-run --no-default-browser-check --disable-component-extensions-with-background-pages --disable-extensions --disable-default-apps --disable-breakpad --disable-crashpad --disable-background-networking --disable-domain-reliability --disable-component-update --disable-sync --disable-features=AutofillServerCommunication --in-process-gpu ${presets.perf}`.split(' ')
  ], 'stdio', extra);
};