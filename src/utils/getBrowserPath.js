import { existsInPathOrInBin } from './existsInPathOrInBin.js'

export const getBrowserPath = async (browser, { browserPaths, binariesInPath }) => {
  for (const path of Array.isArray(browserPaths[browser]) ? browserPaths[browser] : [ browserPaths[browser] ]) {
    // log('checking if ' + browser + ' exists:', path, await exists(path));

    if (await existsInPathOrInBin(path, binariesInPath)) return path;
  }

  return null;
};