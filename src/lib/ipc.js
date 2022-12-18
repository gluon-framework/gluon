export default ({ browserName, browserInfo }, { evalInWindow, evalOnNewDocument, pageLoadPromise }) => {
  const injection = `(() => {
if (window.Gluon) return;
let onIPCReply = {}, ipcListeners = {};
window.Gluon = {
  versions: {
    gluon: '${process.versions.gluon}',
    builder: '${'GLUGUN_VERSION' === 'G\LUGUN_VERSION' ? 'nothing' : 'Glugun GLUGUN_VERSION'}',
    node: '${process.versions.node}',
    browser: '${browserInfo.product.split('/')[1]}',
    browserType: '${browserName.startsWith('Firefox') ? 'firefox' : 'chromium'}',
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

      return reply;
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

delete window._gluonSend;
})();`;

  evalInWindow(injection);
  evalOnNewDocument(injection);

  let onIPCReply = {}, ipcListeners = {};
  const sendToWindow = async (type, data, id = undefined) => {
    const isReply = !!id;
    id = id ?? Math.random().toString().split('.')[1];

    await pageLoadPromise; // wait for page to load before sending, otherwise messages won't be heard
    evalInWindow(`window.Gluon.ipc._receive(${JSON.stringify({
      id,
      type,
      data
    })})`);

    if (isReply) return; // we are replying, don't expect reply back

    const reply = await new Promise(res => {
      onIPCReply[id] = msg => res(msg);
    });

    return reply;
  };

  const onWindowMessage = async ({ id, type, data }) => {
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

  return [
    onWindowMessage,
    () => evalInWindow(injection),

    {
      on: (type, cb) => {
        if (!ipcListeners[type]) ipcListeners[type] = [];
        ipcListeners[type].push(cb);
      },

      removeListener: (type, cb) => {
        if (!ipcListeners[type]) return false;
        ipcListeners[type].splice(ipcListeners[type].indexOf(cb), 1);
      },

      send: sendToWindow,
  } ];
};