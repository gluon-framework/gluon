import { getBrowserPath } from './getBrowserPath.js'
import { getBrowserType } from './getBrowserType.js'

export const findBrowserPath = async (forceBrowser, forceEngine, { browserPaths, binariesInPath }) => {
  if (forceBrowser) {
    return {
      path: await getBrowserPath(forceBrowser, { browserPaths, binariesInPath }),
      name: forceBrowser
    }
  }

  for (const x in browserPaths) {
    if (process.argv.includes('--' + x) || process.argv.includes('--' + x.split('_')[0])) {
      return {
        path: await getBrowserPath(x, { browserPaths, binariesInPath }),
        name: x
      }
    }
  }

  if (process.argv.some(x => x.startsWith('--browser='))) {
    const given = process.argv.find(x => x.startsWith('--browser='));
    const split = given.slice(given.indexOf('=') + 1).split(',');
    const name = split[0];
    const path = split.slice(1).join(',');

    return {
      path: path || await getBrowserPath(name, { browserPaths, binariesInPath }),
      name: name
    }
  }

  for (const name in browserPaths) {
    const path = await getBrowserPath(name, { browserPaths, binariesInPath });

    if (path) {
      if (forceEngine && getBrowserType(name) !== forceEngine) continue; // if forceEngine is set, ignore path if it isn't

      return { path, name }
    }
  }

  return { path: undefined, name: undefined };
};