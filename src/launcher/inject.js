import { writeFile } from 'fs/promises';
import { log } from '../lib/logger.js';

import IPCApi from '../lib/ipc.js';
import LocalCDP from '../lib/local/cdp.js';

import IdleApi from '../api/idle.js';
import ControlsApi from '../api/controls.js';
import V8CacheApi from '../api/v8Cache.js';

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

export default async (CDP, proc, injectionType = 'browser', { dataPath, browserName, browserType, openingLocal, localUrl, url, closeHandlers }) => {
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

  // when the process has exited (all windows closed), clean up window internally
  proc.on('exit', () => {
    Window.close();
  });

  const browserInfo = await CDP.sendMessage('Browser.getVersion');
  log('browser:', browserInfo.product);

  let sessionId;
  if (injectionType === 'browser') sessionId = await acquireTarget(CDP, target => target.url !== 'about:blank');

  if (openingLocal && browserType === 'chromium') await LocalCDP(CDP, { sessionId, localUrl, url });

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
    browserType
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
    engine: generateVersionInfo(browserType, browserInfo.product.split('/')[1]),
    jsEngine: generateVersionInfo(browserType === 'chromium' ? 'v8' : 'spidermonkey', browserInfo.jsVersion)
  };

  const Window = {
    page: {
      eval: evalInWindow,
      loaded: pageLoadPromise,

      title: val => {
        if (!val) return evalInWindow('document.title');
        return evalInWindow(`document.title = \`${val}\``);
      },

      reload: async (ignoreCache = false) => {
        await Window.cdp.send('Page.reload', {
          ignoreCache
        });
      },

      printToPDF: async (...args) => {
        let path, options = {};

        if (args.length === 1) {
          if (typeof args[0] === 'string') path = args[0];
            else options = { ...args[0] };
        }

        if (args.length === 2) {
          path = args[0];
          options = { ...args[1] };
        }

        if (options.margins) {
          const { top, bottom, left, right } = options.margins;
          if (top) options.marginTop = top;
          if (bottom) options.marginBottom = bottom;
          if (left) options.marginLeft = left;
          if (right) options.marginRight = right;

          delete options.margins;
        }

        const { data } = await Window.cdp.send('Page.printToPDF', options);
        const buffer = Buffer.from(data, 'base64');

        if (path) await writeFile(path, buffer);

        return buffer;
      }
    },

    ipc: IPC,

    cdp: {
      send: (method, params, useSessionId = true) => CDP.sendMessage(method, params, useSessionId ? sessionId : undefined),
      on: (method, handler, once = false) => {
        const unhook = CDP.onMessage(msg => {
          if (msg.method === method) {
            handler(msg);
            if (once) unhook();
          }
        });

        return unhook;
      }
    },

    close: () => {
      if (Window.closed) return false;

      for (const handler of closeHandlers) handler(); // extra api handlers which need to be closed

      CDP.sendMessage('Browser.close');
      CDP.close();
      proc.kill();

      return Window.closed = true;
    },
    closed: false,

    versions
  };

  // Close window fully internally if browser process closes
  proc.on('close', Window.close);

  // Close browser fully if Node exits
  process.on('exit', Window.close);

  const interruptHandler = () => {
    Window.close();
    process.exit();
  };

  process.on('SIGINT', interruptHandler);
  process.on('SIGUSR1', interruptHandler);
  process.on('SIGUSR2', interruptHandler);
  process.on('SIGTERM', interruptHandler);
  // process.on('uncaughtException', interruptHandler);

  Window.idle = await IdleApi(Window.cdp, { browserType, closeHandlers });
  Window.controls = await ControlsApi(Window.cdp);
  Window.v8Cache = await V8CacheApi(Window.cdp, evalInWindow, { browserType, dataPath });

  return Window;
};