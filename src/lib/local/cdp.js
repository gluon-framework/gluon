import { basename, dirname, extname, join } from 'path';
import { readFile } from 'fs/promises';
import { log } from '../logger';

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

      let error = false;

      const body = await readFile(path, 'utf8').catch(() => false);
      if (!body) error = 404;

      return await CDP.sendMessage('Fetch.fulfillRequest', {
        requestId,
        responseCode: error || 200,
        body: Buffer.from(error ? '' : body).toString('base64'), // CDP uses base64 encoding for request body
        // need to add our own headers or not?
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