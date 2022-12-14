import { spawn } from 'child_process';

import makeIPCApi from './ipc.js';
import ConnectCDP from './cdp.js';

const presets = { // Presets from OpenAsar
  'base': '--autoplay-policy=no-user-gesture-required --disable-features=WinRetrieveSuggestionsOnlyOnDemand,HardwareMediaKeyHandling,MediaSessionService', // Base Discord
  'perf': '--enable-gpu-rasterization --enable-zero-copy --ignore-gpu-blocklist --enable-hardware-overlays=single-fullscreen,single-on-top,underlay --enable-features=EnableDrDc,CanvasOopRasterization,BackForwardCache:TimeToLiveInBackForwardCacheInSeconds/300/should_ignore_blocklists/true/enable_same_site/true,ThrottleDisplayNoneAndVisibilityHiddenCrossOriginIframes,UseSkiaRenderer,WebAssemblyLazyCompilation --disable-features=Vulkan --force_high_performance_gpu', // Performance
  'battery': '--enable-features=TurnOffStreamingMediaCachingOnBattery --force_low_power_gpu', // Known to have better battery life for Chromium?
  'memory': '--in-process-gpu --js-flags="--lite-mode --optimize_for_size --wasm_opt --wasm_lazy_compilation --wasm_lazy_validation --always_compact" --renderer-process-limit=2 --enable-features=QuickIntensiveWakeUpThrottlingAfterLoading' // Less (?) memory usage
};

export default async ({ browserName, browserPath, dataPath }, { url, windowSize }) => {
  const proc = spawn(browserPath, [
    `--app=${url}`,
    `--remote-debugging-pipe`,
    `--user-data-dir=${dataPath}`,
    windowSize ? `--window-size=${windowSize.join(',')}` : '',
    ...`--new-window --disable-extensions --disable-default-apps --disable-breakpad --disable-crashpad --disable-background-networking --disable-domain-reliability --disable-component-update --disable-sync --disable-features=AutofillServerCommunication ${presets.perf}`.split(' ')
  ].filter(x => x), {
    detached: false,
    stdio: ['ignore', 'pipe', 'pipe', 'pipe', 'pipe']
  });

  proc.stdout.pipe(proc.stdout);
  proc.stderr.pipe(proc.stderr);

  // todo: move this to it's own library
  const { 3: pipeWrite, 4: pipeRead } = proc.stdio;

  const CDP = await ConnectCDP({ pipe: { pipeWrite, pipeRead }});

  log('connected to CDP over stdio pipe');

  let pageLoadCallback = () => {}, onWindowMessage = () => {};
  CDP.onMessage(msg => {
    if (msg.method === 'Runtime.bindingCalled' && msg.name === 'gluonSend') onWindowMessage(JSON.parse(msg.payload));
    if (msg.method === 'Page.frameStoppedLoading') pageLoadCallback(msg.params);
    if (msg.method === 'Runtime.executionContextCreated') injectIPC(); // ensure IPC injection again
  });


  let browserInfo;
  CDP.sendMessage('Browser.getVersion').then(x => { // get browser info async as not important
    browserInfo = x;
    log('browser:', x.product);
  });

  const target = (await CDP.sendMessage('Target.getTargets')).targetInfos[0];

  const { sessionId } = await CDP.sendMessage('Target.attachToTarget', {
    targetId: target.targetId,
    flatten: true
  });

  CDP.sendMessage('Runtime.enable', {}, sessionId); // enable runtime API

  CDP.sendMessage('Runtime.addBinding', { // setup sending from window to Node via Binding
    name: '_gluonSend'
  }, sessionId);

  const evalInWindow = async func => {
    return await CDP.sendMessage(`Runtime.evaluate`, {
      expression: typeof func === 'string' ? func : `(${func.toString()})()`
    }, sessionId);
  };

  const [ ipcMessageCallback, injectIPC, IPCApi ] = await makeIPCApi({
    browserName,
    browserInfo
  }, {
    evaluate: params => CDP.sendMessage(`Runtime.evaluate`, params, sessionId),
    addScriptToEvaluateOnNewDocument: params => CDP.sendMessage('Page.addScriptToEvaluateOnNewDocument', params, sessionId),
    pageLoadPromise: new Promise(res => pageLoadCallback = res)
  });
  onWindowMessage = ipcMessageCallback;

  log('finished setup');

  return {
    window: {
      eval: evalInWindow,
    },

    ipc: IPCApi,

    cdp: {
      send: (method, params) => CDP.sendMessage(method, params, sessionId)
    }
  };
};