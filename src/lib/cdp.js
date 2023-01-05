import WebSocket from 'ws';
import { get } from 'http';

const logCDP = process.argv.includes('--cdp-logging');

export default async ({ pipe: { pipeWrite, pipeRead } = {}, port }) => {
  let messageCallbacks = [], onReply = {};
  const onMessage = msg => {
    if (closed) return; // closed, ignore

    msg = JSON.parse(msg);

    if (logCDP) log('received', msg);
    if (onReply[msg.id]) {
      onReply[msg.id](msg);
      delete onReply[msg.id];

      return;
    }

    for (const callback of messageCallbacks) callback(msg);
  };

  let closed = false;
  let _send, _close;

  let msgId = 0;
  const sendMessage = async (method, params = {}, sessionId = undefined) => {
    if (closed) throw new Error('CDP connection closed');

    const id = msgId++;

    const msg = {
      id,
      method,
      params
    };

    if (sessionId) msg.sessionId = sessionId;

    _send(JSON.stringify(msg));

    if (logCDP) log('sent', msg);

    const reply = await new Promise(res => {
      onReply[id] = msg => res(msg);
    });

    if (reply.error) return new Error(reply.error.message);

    return reply.result;
  };

  if (port) {
    const continualTrying = func => new Promise(resolve => {
      const attempt = async () => {
        try {
          process.stdout.write('.');
          resolve(await func());
        } catch (e) { // fail, wait 100ms and try again
          await new Promise(res => setTimeout(res, 200));
          await attempt();
        }
      };

      attempt();
    });

    const targets = await continualTrying(() => new Promise((resolve, reject) => get(`http://127.0.0.1:${port}/json/list`, res => {
      let body = '';
      res.on('data', chunk => body += chunk.toString());
      res.on('end', () => {
        try {
          resolve(JSON.parse(body))
        } catch {
          reject();
        }
      });
    }).on('error', reject)));

    console.log();

    const target = targets[0];

    log('got target', target);

    const ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise(resolve => ws.on('open', resolve));

    ws.on('message', data => onMessage(data));

    _send = data => ws.send(data);

    _close = () => ws.close();
  } else {
    let pending = '';
    pipeRead.on('data', buf => {
      if (closed) return; // closed, ignore

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

    _send = data => {
      pipeWrite.write(data);
      pipeWrite.write('\0');
    };

    _close = () => {};
  }

  return {
    onMessage: (_callback, once = false) => {
      const callback = once ? msg => {
        _callback(msg);
        messageCallbacks.splice(messageCallbacks.indexOf(callback), 1); // remove self
      } : _callback;

      messageCallbacks.push(callback);
    },

    sendMessage,

    close: () => {
      closed = true;
      _close();
    }
  };
};