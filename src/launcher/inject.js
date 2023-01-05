import IPCApi from '../lib/ipc.js';

import IdleApi from '../api/idle.js';
import ControlsApi from '../api/controls.js';

export default async (CDP, proc, injectionType = 'browser', { browserName } = { browserName: 'unknown' }) => {
  let pageLoadCallback, pageLoadPromise = new Promise(res => pageLoadCallback = res);
  let frameLoadCallback = () => {}, onWindowMessage = () => {};
  CDP.onMessage(msg => {
    if (msg.method === 'Runtime.bindingCalled' && msg.params.name === '_gluonSend') onWindowMessage(JSON.parse(msg.params.payload));
    if (msg.method === 'Page.frameStoppedLoading') frameLoadCallback(msg.params);
    if (msg.method === 'Page.loadEventFired') pageLoadCallback();
    if (msg.method === 'Runtime.executionContextCreated') injectIPC(); // ensure IPC injection again
  });

  const browserInfo = await CDP.sendMessage('Browser.getVersion');
  log('browser:', browserInfo.product);

  const browserEngine = browserInfo.jsVersion.startsWith('1.') ? 'firefox' : 'chromium';

  let sessionId;
  if (injectionType === 'browser') { // connected to browser itself, need to get and attach to a target
    const target = (await CDP.sendMessage('Target.getTargets')).targetInfos[0];

    sessionId = (await CDP.sendMessage('Target.attachToTarget', {
      targetId: target.targetId,
      flatten: true
    })).sessionId;
  }


  CDP.sendMessage('Runtime.enable', {}, sessionId); // enable runtime API

  CDP.sendMessage('Runtime.addBinding', { // setup sending from window to Node via Binding
    name: '_gluonSend'
  }, sessionId);

  const evalInWindow = async func => (await CDP.sendMessage(`Runtime.evaluate`, {
    expression: typeof func === 'string' ? func : `(${func.toString()})()`
  }, sessionId)).result.value;


  const [ ipcMessageCallback, injectIPC, IPC ] = await IPCApi({
    browserName,
    browserInfo,
    browserEngine
  }, {
    evalInWindow,
    evalOnNewDocument: source => CDP.sendMessage('Page.addScriptToEvaluateOnNewDocument', { source }, sessionId),
    pageLoadPromise: new Promise(res => frameLoadCallback = res)
  });

  onWindowMessage = ipcMessageCallback;

  log('finished setup');

  evalInWindow('document.readyState').then(readyState => { // check if already loaded, if so trigger page load promise
    if (readyState === 'complete' || readyState === 'ready') pageLoadCallback();
  });


  const generateVersionInfo = (name, version) => ({
    name,
    version,
    major: parseInt(version.split('.')[0])
  });

  const versions = {
    product: generateVersionInfo(browserName, browserInfo.product.split('/')[1]),
    engine: generateVersionInfo(browserEngine, browserInfo.product.split('/')[1]),
    jsEngine: generateVersionInfo(browserEngine === 'chromium' ? 'v8' : 'spidermonkey', browserInfo.jsVersion)
  };

  const closeHandlers = [];
  const Window = {
    page: {
      eval: evalInWindow,
      loaded: pageLoadPromise
    },

    ipc: IPC,

    cdp: {
      send: (method, params, useSessionId = true) => CDP.sendMessage(method, params, useSessionId ? sessionId : undefined)
    },

    close: () => {
      for (const handler of closeHandlers) handler(); // extra api handlers which need to be closed

      CDP.close();
      proc.kill();
    },

    versions
  };

  proc.on('close', Window.close);

  Window.idle = await IdleApi(Window.cdp, { browserEngine, closeHandlers });
  Window.controls = await ControlsApi(Window.cdp);

  return Window;
};