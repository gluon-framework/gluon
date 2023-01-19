import { spawn } from 'child_process';
import { log } from '../lib/logger.js';

import ConnectCDP from '../lib/cdp.js';
import InjectInto from './inject.js';

const portRange = [ 10000, 60000 ];
const generatePort = () => (Math.floor(Math.random() * (portRange[1] - portRange[0] + 1)) + portRange[0]);

export default async (browserPath, args, transport, extra) => {
  const port = transport === 'websocket' ? generatePort() : null;

  const proc = spawn(browserPath, [
    transport === 'stdio' ? `--remote-debugging-pipe` : `--remote-debugging-port=${port}`,
    ...args
  ].filter(x => x), {
    detached: false,
    stdio: ['ignore', 'pipe', 'pipe', 'pipe', 'pipe']
  });

  log(`connecting to CDP over ${transport === 'stdio' ? 'stdio pipe' : `websocket (${port})`}...`);

  let CDP;
  switch (transport) {
    case 'websocket':
      CDP = await ConnectCDP({ port });
      break;

    case 'stdio':
      const { 3: pipeWrite, 4: pipeRead } = proc.stdio;
      CDP = await ConnectCDP({ pipe: { pipeWrite, pipeRead } });
      break;
  }

  return await InjectInto(CDP, proc, 'browser', extra);
};