import { basename, dirname, extname, join } from 'path';
import { readFile } from 'fs/promises';
import { log } from '../logger.js';
import mimeType from '../mimeType.js';

const generatePath = (pathname, indexFile) => {
  if (pathname === '/') return indexFile;
  if (extname(pathname) === '') return pathname + '.html';

  return pathname;
};

export default async (CDP, { sessionId, url: givenPath, localUrl }) => {
  const basePath = extname(givenPath) ? dirname(givenPath) : givenPath;
  const indexFile = extname(givenPath) ? basename(givenPath) : 'index.html';

  CDP.onMessage(async msg => {
    if (msg.method === 'Fetch.requestPaused') {
      const { requestId, request } = msg.params;

      const url = new URL(request.url);
      const path = join(basePath, generatePath(url.pathname, indexFile));
      const ext = extname(path).slice(1);

      let error = false;

      const body = await readFile(path, 'utf8').catch(() => false);
      if (!body) error = 404;

      if (error) return await CDP.sendMessage('Fetch.fulfillRequest', {
        requestId,
        responseCode: error,
        body: Buffer.from('').toString('base64') // CDP uses base64 encoding for request body
      });

      return await CDP.sendMessage('Fetch.fulfillRequest', {
        requestId,
        responseCode: 200,
        body: Buffer.from(body).toString('base64'), // CDP uses base64 encoding for request body
        responseHeaders: [
          {
            name: 'Content-Type',
            value: mimeType(ext)
          }
        ]
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