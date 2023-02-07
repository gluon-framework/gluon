import { basename, dirname, extname, join } from 'path';
import { readFile } from 'fs/promises';

import mimeType from '../mimeType.js';

const generatePath = (pathname, indexFile) => {
  if (pathname === '/') return indexFile;
  if (extname(pathname) === '') return pathname + '.html';

  return pathname;
};

export default givenPath => {
  const basePath = extname(givenPath) ? dirname(givenPath) : givenPath;
  const indexFile = extname(basePath) ? basename(basePath) : 'index.html';

  return async url => {
    url = new URL(url);

    const path = join(basePath, generatePath(url.pathname, indexFile));
    const ext = extname(path).slice(1);

    let error = false;

    const body = await readFile(path, 'utf8').catch(() => false);
    if (!body) error = 404;

    if (error) return {
      status: 404,
      error: true,
      body: '',
      headers: {},
    };

    return {
      status: 200,
      body,
      headers: {
        'Content-Type': mimeType(ext)
      }
    };
  };
};