import { basename, dirname, extname, join } from 'path';
import { readFile } from 'fs/promises';
import { createServer } from 'http';
import { log } from '../../utils/logger';

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

    console.log('SERVER', url, path);

    let error = false;

    const body = await readFile(path, 'utf8').catch(() => false);
    if (!body) error = 404;

    console.log('SERVER', error);

    if (error) {
      res.writeHead(error);
      return res.end();
    }

    res.writeHead(200, {

    });

    res.end(body, 'utf8');
  }).listen(port, '127.0.0.1');

  log('local setup');

  return () => server.close();
};