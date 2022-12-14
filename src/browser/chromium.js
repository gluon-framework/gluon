import { spawn } from 'child_process';

import makeIPCApi from './ipc.js';

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

  let onReply = {}, pageLoadCallback = () => {}, onWindowMessage = () => {};
  const onMessage = msg => {
    msg = JSON.parse(msg);

    // log('received', msg);
    if (onReply[msg.id]) {
      onReply[msg.id](msg);
      delete onReply[msg.id];
    }

    if (msg.method === 'Runtime.bindingCalled' && msg.name === 'gluonSend') onWindowMessage(JSON.parse(msg.payload));
    if (msg.method === 'Page.frameStoppedLoading') pageLoadCallback(msg.params);
    if (msg.method === 'Runtime.executionContextCreated') injectIPC(); // ensure IPC injection again
  };

  let msgId = 0;
  const sendMessage = async (method, params = {}, sessionId = undefined) => {
    const id = msgId++;

    const msg = {
      id,
      method,
      params
    };

    if (sessionId) msg.sessionId = sessionId;

    pipeWrite.write(JSON.stringify(msg));
    pipeWrite.write('\0');

    // log('sent', msg);

    const reply = await new Promise(res => {
      onReply[id] = msg => res(msg);
    });

    return reply.result;
  };

  let pending = '';
  pipeRead.on('data', buf => {
    let end = buf.indexOf('\0'); // messages are null separated

    if (end === -1) { // no complete message yet
      pending += buf.toString();
      return;
    }

    let start = 0;
    while (end !== -1) { // while we have pending complete messages, dispatch them
      const message = pending + buf.toString(undefined, start, end); // get next whole message
      onMessage(message);

      start = end + 1; // find next ending
      end = buf.indexOf('\0', start);
      pending = '';
    }

    pending = buf.toString(undefined, start); // update pending with current pending
  });

  pipeRead.on('close', () => log('pipe read closed'));

  // await new Promise(res => setTimeout(res, 1000));

  let browserInfo;
  sendMessage('Browser.getVersion').then(x => { // get browser info async as not important
    browserInfo = x;
    log('browser:', x.product);
  });

  const target = (await sendMessage('Target.getTargets')).targetInfos[0];

  const { sessionId } = await sendMessage('Target.attachToTarget', {
    targetId: target.targetId,
    flatten: true
  });

  sendMessage('Runtime.enable', {}, sessionId); // enable runtime API

  sendMessage('Runtime.addBinding', { // setup sending from window to Node via Binding
    name: '_gluonSend'
  }, sessionId);

  const evalInWindow = async func => {
    return await sendMessage(`Runtime.evaluate`, {
      expression: typeof func === 'string' ? func : `(${func.toString()})()`
    }, sessionId);
  };


  const [ ipcMessageCallback, injectIPC, IPCApi ] = await makeIPCApi({
    browserName,
    browserInfo
  }, {
    evaluate: params => sendMessage(`Runtime.evaluate`, params, sessionId),
    addScriptToEvaluateOnNewDocument: params => sendMessage('Page.addScriptToEvaluateOnNewDocument', params, sessionId),
    pageLoadPromise: new Promise(res => pageLoadCallback = res)
  });
  onWindowMessage = ipcMessageCallback;

  return {
    window: {
      eval: evalInWindow,
    },

    ipc: IPCApi,

    cdp: {
      send: (method, params) => sendMessage(method, params, sessionId)
    }
  };
};