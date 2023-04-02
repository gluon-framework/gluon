import { log } from './logger.js';
const logIPC = process.argv.includes('--ipc-logging');

export default ({ browserName, browserInfo, browserType }, { evalInWindow, evalOnNewDocument }) => {
  const injection = `(() => {
if (window.Gluon) return;
let onIPCReply = {}, ipcListeners = {};
window.Gluon = {
  versions: {
    gluon: '${process.versions.gluon}',
    builder: '${'GLUGUN_VERSION' === 'G\LUGUN_VERSION' ? 'nothing' : 'Glugun GLUGUN_VERSION'}',
    node: '${process.versions.node}',
    browser: '${browserInfo.product.split('/')[1]}',
    browserType: '${browserType}',
    product: '${browserName}',

    js: {
      node: '${process.versions.v8}',
      browser: '${browserInfo.jsVersion}'
    },

    embedded: {
      node: ${'EMBEDDED_NODE' === 'true' ? 'true' : 'false'},
      browser: false
    }
  },

  ipc: {
    send: async (type, data, id = undefined) => {
      const isReply = !!id;
      id = id ?? Math.random().toString().split('.')[1];

      window.Gluon.ipc._send(JSON.stringify({
        id,
        type,
        data
      }));

      if (isReply) return;

      const reply = await new Promise(res => {
        onIPCReply[id] = msg => res(msg);
      });

      return reply.data;
    },

    on: (type, cb) => {
      if (!ipcListeners[type]) ipcListeners[type] = [];
      ipcListeners[type].push(cb);
    },

    removeListener: (type, cb) => {
      if (!ipcListeners[type]) return false;
      ipcListeners[type].splice(ipcListeners[type].indexOf(cb), 1);
    },

    _receive: async msg => {
      const { id, type, data } = msg;

      if (onIPCReply[id]) {
        onIPCReply[id]({ type, data });
        delete onIPCReply[id];
        return;
      }

      if (ipcListeners[type]) {
        let reply;

        for (const cb of ipcListeners[type]) {
          const ret = await cb(data);
          if (!reply) reply = ret; // use first returned value as reply
        }

        if (reply) return Gluon.ipc.send('reply', reply, id); // reply with wanted reply
      }

      Gluon.ipc.send('pong', null, id);
    },

    _send: window._gluonSend
  },
};

const _store = {};
const updateBackend = (key, value) => { // update backend with a key/value change
  Gluon.ipc.send('web store change', { key, value });
};

Gluon.ipc.store = new Proxy({
  get: (key) => {
    return _store[key];
  },

  set: (key) => {
    _store[key] = value;

    updateBackend(key, value);
    return value;
  },

  keys: () => Object.keys(_store)
}, {
  get(_obj, key) {
    return _store[key];
  },

  set(_obj, key, value) {
    _store[key] = value;

    updateBackend(key, value);
    return true;
  },

  deleteProperty(_obj, key) {
    delete _store[key];

    updateBackend(key, undefined);
    return true;
  }
});

Gluon.ipc.on('backend store change', ({ key, value }) => {
  if (value === undefined) delete _store[key];
    else _store[key] = value;
});

delete window._gluonSend;
})();`;

  evalInWindow(injection);
  evalOnNewDocument(injection);

  let onIPCReply = {}, ipcListeners = {};
  const sendToWindow = async (type, data, id = undefined) => {
    const isReply = !!id;
    id = id ?? Math.random().toString().split('.')[1];

    if (logIPC) log('IPC: send', { type, data, id });

    evalInWindow(`window.Gluon.ipc._receive(${JSON.stringify({
      id,
      type,
      data
    })})`);

    if (isReply) return; // we are replying, don't expect reply back

    const reply = await new Promise(res => {
      onIPCReply[id] = msg => res(msg);
    });

    return reply.data;
  };

  const onWindowMessage = async ({ id, type, data }) => {
    if (logIPC) log('IPC: recv', { type, data, id });

    if (onIPCReply[id]) {
      onIPCReply[id]({ type, data });
      delete onIPCReply[id];
      return;
    }

    if (ipcListeners[type]) {
      let reply;

      for (const cb of ipcListeners[type]) {
        const ret = await cb(data);
        if (!reply) reply = ret; // use first returned value as reply
      }

      if (reply) return sendToWindow('reply', reply, id); // reply with wanted reply
    }

    sendToWindow('pong', null, id); // send simple pong to confirm
  };

  let API = {
    on: (type, cb) => {
      if (!ipcListeners[type]) ipcListeners[type] = [];
      ipcListeners[type].push(cb);
    },

    removeListener: (type, cb) => {
      if (!ipcListeners[type]) return false;
      ipcListeners[type].splice(ipcListeners[type].indexOf(cb), 1);

      if (ipcListeners[type].length === 0) delete ipcListeners[type]; // clean up - remove type from listeners if 0 listeners left
    },

    send: sendToWindow,
  };

  // Expose API
  const makeExposeKey = key => 'exposed ' + key;

  const expose = (key, func) => {
    if (typeof func !== 'function') return new Error('Invalid arguments (expected key and function)');
    if (logIPC) log('IPC: expose', key);

    const exposeKey = makeExposeKey(key);

    API.on(exposeKey, args => func(...args)); // handle IPC events
    evalInWindow(`Gluon.ipc['${key}'] = (...args) => Gluon.ipc.send('${exposeKey}', args)`); // add wrapper func to window
  };

  const unexpose = key => {
    const exposeKey = makeExposeKey(key);

    const existed = API.removeListener(exposeKey); // returns false if type isn't registered/active
    if (!existed) return;

    evalInWindow(`delete Gluon.ipc['${key}']`); // remove wrapper func from window
  };

  API.expose = (...args) => {
    if (args.length === 1) { // given object to expose
      for (const key in args[0]) expose(key, args[0][key]); // expose all keys given

      return;
    }

    if (args.length === 2) return expose(args[0], args[1]);

    return new Error('Invalid arguments (expected object or key and function)');
  };

  API.unexpose = unexpose;

  const _store = {};
  const updateWeb = (key, value) => { // update web with a key/value change
    if (logIPC) log('IPC: store write (backend)', key, value);

    API.send('backend store change', { key, value });
  };

  API.store = new Proxy({
    get: (key) => {
      return _store[key];
    },

    set: (key) => {
      _store[key] = value;

      updateWeb(key, value);
      return value;
    },

    keys: () => Object.keys(_store)
  }, {
    get(_obj, key) {
      return _store[key];
    },

    set(_obj, key, value) {
      _store[key] = value;

      updateWeb(key, value);
      return true;
    },

    deleteProperty(_obj, key) {
      delete _store[key];

      updateWeb(key, undefined);
      return true;
    }
  });

  API.on('web store change', ({ key, value }) => {
    if (logIPC) log('IPC: store write (web)', key, value);

    if (value === undefined) delete _store[key];
      else _store[key] = value;
  });

  API = new Proxy(API, { // setter and deleter API
    set(_obj, key, value) {
      expose(key, value);
      return true;
    },

    deleteProperty(_obj, key) {
      unexpose(key);
      return true;
    }
  });

  return [
    onWindowMessage,
    () => evalInWindow(injection),
    API
  ];
};