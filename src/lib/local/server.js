import { basename, dirname, extname, join } from 'path';
import { readFile } from 'fs/promises';
import { createServer } from 'http';
import { log } from '../logger.js';
import mimeType from '../mimeType.js';

const generatePath = (pathname, indexFile) => {
  if (pathname === '/') return indexFile;
  if (extname(pathname) === '') return pathname + '.html';

  return pathname;
};

export default async ({ url: givenPath, localUrl }) => {
  const basePath = extname(givenPath) ? dirname(givenPath) : givenPath;
  const indexFile = extname(givenPath) ? basename(givenPath) : 'index.html';

  const port = parseInt(localUrl.split(':').pop());
  const server = createServer(async (req, res) => {
    const url = new URL(`http://localhost:${port}` + decodeURI(req.url));
    const path = join(basePath, generatePath(url.pathname, indexFile));
    const ext = extname(path).slice(1);

    let error = false;

    const body = await readFile(path, 'utf8').catch(() => false);
    if (!body) error = 404;

    if (error) {
      res.writeHead(error);
      return res.end();
    }

    res.writeHead(200, {
      'Content-Type': mimeType(ext)
    });

    res.end(body, 'utf8');
  }).listen(port, '127.0.0.1');

  log('local setup');

  return () => server.close();
};