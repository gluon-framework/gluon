import { cp, writeFile, readFile, readdir, rm } from 'fs/promises';
import { join, dirname } from 'path';

import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const buildDir = join(__dirname, '..', 'build');
const _buildWin32 = async (name, dir, attrs) => {
  await cp(dir, join(buildDir, 'src'), { recursive: true }); // copy project src to build
  await cp(join(__dirname, '..', 'gluon'), join(buildDir, 'src', 'gluon'), { recursive: true }); // copy gluon into build

  for (const m of [ 'ws', 'chrome-remote-interface' ]) {
    const dest = join(buildDir, 'src', 'node_modules', m);
    await cp(join(__dirname, '..', 'node_modules', m), dest, { recursive: true }); // copy gluon deps into build

    for (const x of await readdir(dest)) {
      if ([ 'bin', 'README.md', 'webpack.config.json', 'browser.js' ].includes(x)) await rm(join(dest, x), { recursive: true });
    }
  }

  await writeFile(join(buildDir, `${name}.bat`), `node src`);

  // await writeFile(join(buildDir, 'gluon_info.txt'), `Gluon 0.1, built with Glugun 0.1 (win32 ${attrs.join(',')})`);
  let indexContent = await readFile(join(buildDir, 'src', 'index.js'), 'utf8');

  indexContent = indexContent.replace('../gluon/', './gluon/')
    .replaceAll('GLUGUN_VERSION', '1.0')
    .replaceAll('SYSTEM_CHROMIUM', attrs.includes('system-chromium'))
    .replaceAll('SYSTEM_NODE', attrs.includes('system-node'));

  await writeFile(join(buildDir, 'src', 'index.js'), indexContent);
};

export const build = async (name, dir, platform = 'win32', attrs = 'system-chromium,system-node') => {
  console.log('building...', name, dir, platform, attrs);

  switch (platform) {
    case 'win32': _buildWin32(name, dir, attrs.split(','));
  }
};

const [ name, dir ] = process.argv.slice(2);
build(name, dir);