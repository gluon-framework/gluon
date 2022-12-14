import WebSocket from 'ws';
import { get } from 'http';

export default async ({ pipe: { pipeWrite, pipeRead } = {}, port }) => {
  let messageCallbacks = [], onReply = {};
  const onMessage = msg => {
    msg = JSON.parse(msg);

    // log('received', msg);
    if (onReply[msg.id]) {
      onReply[msg.id](msg);
      delete onReply[msg.id];

      return;
    }

    for (const callback of messageCallbacks) callback(msg);
  };

  let _send;

  let msgId = 0;
  const sendMessage = async (method, params = {}, sessionId = undefined) => {
    const id = msgId++;

    const msg = {
      id,
      method,
      params
    };

    if (sessionId) msg.sessionId = sessionId;

    _send(JSON.stringify(msg));

    // log('sent', msg);

    const reply = await new Promise(res => {
      onReply[id] = msg => res(msg);
    });

    return reply.result;
  };

  if (port) {
    const targets = await new Promise(resolve => get(`http://localhost:${port}/json/list`, res => {
      let body = '';
      res.on('data', chunk => body += chunk.toString());
      res.on('end', () => resolve(JSON.parse(body)));
    }));

    const target = targets[0]; // targets.find(x => x.type === 'browser');

    const ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise(res => ws.on('open', res));

    _send = data => ws.send(data);

    ws.on('message', data => onMessage(data));
  } else {
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

    _send = data => {
      pipeWrite.write(data);
      pipeWrite.write('\0');
    };
  }

  return {
    onMessage: (_callback, once = false) => {
      const callback = once ? msg => {
        _callback(msg);
        messageCallbacks.splice(messageCallbacks.indexOf(callback), 1); // remove self
      } : _callback;

      messageCallbacks.push(callback);
    },
    sendMessage
  };
};