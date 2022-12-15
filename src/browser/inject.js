import IPCApi from './ipc.js';

export default async (CDP, injectionType = 'browser', { browserName }) => {
  let pageLoadCallback = () => {}, onWindowMessage = () => {};
  CDP.onMessage(msg => {
    if (msg.method === 'Runtime.bindingCalled' && msg.name === 'gluonSend') onWindowMessage(JSON.parse(msg.payload));
    if (msg.method === 'Page.frameStoppedLoading') pageLoadCallback(msg.params);
    if (msg.method === 'Runtime.executionContextCreated') injectIPC(); // ensure IPC injection again
  });


  let browserInfo, sessionId;
  if (injectionType === 'browser') { // connected to browser itself, need to get and attach to a target
    CDP.sendMessage('Browser.getVersion').then(x => { // get browser info async as we have time while attaching
      browserInfo = x;
      log('browser:', x.product);
    });

    const target = (await CDP.sendMessage('Target.getTargets')).targetInfos[0];

    sessionId = (await CDP.sendMessage('Target.attachToTarget', {
      targetId: target.targetId,
      flatten: true
    })).sessionId;
  } else { // already attached to target
    browserInfo = await CDP.sendMessage('Browser.getVersion');
    log('browser:', browserInfo.product);
  }


  CDP.sendMessage('Runtime.enable', {}, sessionId); // enable runtime API

  CDP.sendMessage('Runtime.addBinding', { // setup sending from window to Node via Binding
    name: '_gluonSend'
  }, sessionId);

  const evalInWindow = async func => {
    return await CDP.sendMessage(`Runtime.evaluate`, {
      expression: typeof func === 'string' ? func : `(${func.toString()})()`
    }, sessionId);
  };


  const [ ipcMessageCallback, injectIPC, IPC ] = await IPCApi({
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

    ipc: IPC,

    cdp: {
      send: (method, params) => CDP.sendMessage(method, params, sessionId)
    }
  };
};