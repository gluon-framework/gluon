import { createServer } from 'http';
import createLocalFulfill from './fulfill.js';
import { log } from '../logger.js';

export default async ({ basePath, url }) => {
  const localFulfill = createLocalFulfill(basePath);

  const port = parseInt(url.split(':').pop());
  const server = createServer(async (req, res) => {
    const { status, body, headers } = await localFulfill(url + decodeURI(req.url));

    res.writeHead(status, headers);
    res.end(body, 'utf8');
  }).listen(port, '127.0.0.1');

  log('local setup');

  return () => server.close();
};