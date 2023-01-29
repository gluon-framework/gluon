import createLocalFulfill from './fulfill.js';
import { log } from '../logger.js';

export default async (CDP, { sessionId, url: givenPath, localUrl }) => {
  const localFulfill = createLocalFulfill(givenPath);

  CDP.onMessage(async msg => {
    if (msg.method === 'Fetch.requestPaused') {
      const { requestId, request } = msg.params;

      const { status, body, headers } = await localFulfill(request.url);

      return await CDP.sendMessage('Fetch.fulfillRequest', {
        requestId,
        responseCode: status,
        body: Buffer.from(body).toString('base64'), // CDP uses base64 encoding for request body
        responseHeaders: Object.keys(headers).map(x => ({ name: x, value: headers[x] }))
      });
    }
  });

  await CDP.sendMessage('Fetch.enable', {
    patterns: [ {
      urlPattern: `${localUrl}*`
    } ]
  });

  await CDP.sendMessage('Page.reload', {}, sessionId);

  log('local setup');
};