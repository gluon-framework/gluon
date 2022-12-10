import { cp, writeFile, readFile, readdir, rm, mkdir, stat, access } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

import * as Esbuild from 'esbuild';
import * as HTMLMinifier from 'html-minifier-terser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const rgb = (r, g, b, msg) => `\x1b[38;2;${r};${g};${b}m${msg}\x1b[0m`;
const log = (...args) => console.log(`[${rgb(235, 69, 158, 'Glugun')}]`, ...args);

const minifyBackend = process.argv.includes('--minify');

const esbuildPlugin = { // esbuild to fix some things in src files
  name: 'glugun-esbuild',
  setup(build) {
    build.onLoad({ filter: /\.js$/ }, async (args) => {
      let source = await readFile(args.path, 'utf8');

      source = source
        .replace(`const __filename = fileURLToPath(import.meta.url);\r\nconst __dirname = dirname(__filename);`, ''); // remove setting __filename/__dirname cause ESM -> CJS

      return { contents: source };
    });
  }
};

const exists = path => access(path).then(() => true).catch(() => false);

const dirSize = async dir => {
  const files = await readdir(dir, { withFileTypes: true });

  const paths = files.map(async file => {
    const path = join(dir, file.name);

    if (file.isDirectory()) return await dirSize(path);
    if (file.isFile()) return (await stat(path)).size;

    return 0;
  });

  return (await Promise.all(paths)).flat(Infinity).reduce((acc, x) => acc + x, 0);
};


const buildDir = join(__dirname, '..', 'build');
const _buildWin32 = async (name, dir, attrs) => {
  // reset build dir
  await rm(buildDir, { recursive: true, force: true });
  await mkdir(buildDir, { recursive: true });

  await cp(dir, join(buildDir, 'src'), { recursive: true }); // copy project src to build
  await cp(join(__dirname, '..', 'gluon'), join(buildDir, 'src', 'gluon'), { recursive: true }); // copy gluon into build

  // await writeFile(join(buildDir, 'gluon_info.txt'), `Gluon 0.1, built with Glugun 0.1 (win32 ${attrs.join(',')})`);
  let indexContent = await readFile(join(buildDir, 'src', 'index.js'), 'utf8');

  indexContent = indexContent.replace('../gluon/', './gluon/');

  await writeFile(join(buildDir, 'src', 'index.js'), indexContent);

  indexContent = await readFile(join(buildDir, 'src', 'gluon', 'index.js'), 'utf8');

  indexContent = indexContent.replaceAll('GLUGUN_VERSION', '2.3')
    .replaceAll('SYSTEM_CHROMIUM', attrs.includes('system-chromium'))
    .replaceAll('SYSTEM_NODE', attrs.includes('system-node'));

  await writeFile(join(buildDir, 'src', 'gluon', 'index.js'), indexContent)

  await writeFile(join(buildDir, `${name}.bat`), `node %~dp0${minifyBackend ? 'out.js' : 'src'}`);

  if (minifyBackend) {
    log(`Pre-minify build size: ${((await dirSize(buildDir)) / 1024 / 1024).toFixed(2)}MB`);

    await Esbuild.build({ // bundle and minify into 1 file
      entryPoints: [ join(buildDir, 'src', 'index.js') ],
      bundle: true,
      minify: true,
      format: 'iife',
      platform: 'node',
      outfile: join(buildDir, 'out.js'),
      plugins: [ esbuildPlugin ]
    });

    const htmlPath = join(buildDir, 'src', 'index.html');
    if (await exists(htmlPath)) {
      const content = await readFile(htmlPath, 'utf8');
      writeFile(join(buildDir, 'index.html'), await HTMLMinifier.minify(content));
    }

    await rm(join(buildDir, 'src'), { recursive: true }); // delete original src
  }
};

export const build = async (name, dir, platform = 'win32', attrs = 'system-chromium,system-node') => {
  log('Building', name, 'on', platform, 'with', attrs.split(',').join(', ') + '...');

  if (minifyBackend) log(`Minifying is experimental!`);

  console.log();
  const startTime = performance.now();
  switch (platform) {
    case 'win32': await _buildWin32(name, dir, attrs.split(','));
  }

  console.log();
  log(`Finished build in: ${((performance.now() - startTime) / 1024).toFixed(2)}s`);
  log(`Final build size: ${((await dirSize(buildDir)) / 1024 / 1024).toFixed(2)}MB`);
};

const [ name, dir ] = process.argv.slice(2);
build(name, dir);