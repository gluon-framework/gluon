import IPCApi from '../lib/ipc.js';
import LocalCDP from '../lib/local/cdp.js';

import IdleApi from '../api/idle.js';
import ControlsApi from '../api/controls.js';

const acquireTarget = async (CDP, filter = () => true) => {
  let target;

  log('acquiring target...');

  while (!target) {
    process.stdout.write('.');
    target = (await CDP.sendMessage('Target.getTargets')).targetInfos.filter(x => x.type === 'page').filter(filter)[0];
    if (!target) await new Promise(res => setTimeout(res, 200));
  }

  console.log();

  return (await CDP.sendMessage('Target.attachToTarget', {
    targetId: target.targetId,
    flatten: true
  })).sessionId;
};

export default async (CDP, proc, injectionType = 'browser', { browserName, openingLocal, localUrl, url, closeHandlers }) => {
  let pageLoadCallback, pageLoadPromise = new Promise(res => pageLoadCallback = res);
  let frameLoadCallback = () => {}, onWindowMessage = () => {};
  CDP.onMessage(msg => {
    if (msg.method === 'Runtime.bindingCalled' && msg.params.name === '_gluonSend') onWindowMessage(JSON.parse(msg.params.payload));
    if (msg.method === 'Page.frameStoppedLoading') frameLoadCallback(msg.params);
    if (msg.method === 'Page.loadEventFired') pageLoadCallback();
    if (msg.method === 'Runtime.executionContextCreated') {
      try {
        injectIPC(); // ensure IPC injection again
      } catch { }
    }
  });

  const browserInfo = await CDP.sendMessage('Browser.getVersion');
  log('browser:', browserInfo.product);

  const browserEngine = browserInfo.jsVersion.startsWith('1.') ? 'firefox' : 'chromium';

  let sessionId;
  if (injectionType === 'browser') sessionId = await acquireTarget(CDP, target => target.url !== 'about:blank');

  if (openingLocal && browserEngine === 'chromium') await LocalCDP(CDP, { sessionId, localUrl, url });

  await CDP.sendMessage('Runtime.enable', {}, sessionId); // enable runtime API

  CDP.sendMessage('Runtime.addBinding', { // setup sending from window to Node via Binding
    name: '_gluonSend'
  }, sessionId);

  const evalInWindow = async func => {
    const reply = await CDP.sendMessage(`Runtime.evaluate`, {
      expression: typeof func === 'string' ? func : `(${func.toString()})()`
    }, sessionId);

    if (reply.exceptionDetails) return new (global[reply.result?.className] ?? Error)((reply.result?.description?.split(':').slice(1).join(':').trim() ?? reply.exceptionDetails.text) + '\n');

    return reply.result?.value ?? reply;
  };

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
    frameLoadCallback();
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

  const Window = {
    page: {
      eval: evalInWindow,
      loaded: pageLoadPromise,

      get title() { return evalInWindow('document.title'); },
      set title(val) { return evalInWindow(`document.title = \`${val}\``); }
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