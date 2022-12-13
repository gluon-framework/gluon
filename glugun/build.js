import { cp, writeFile, readFile, readdir, rm, mkdir, stat, access } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

import * as Esbuild from 'esbuild';
import * as HTMLMinifier from 'html-minifier-terser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const esbuildPlugin = { // esbuild to fix some things in src files
  name: 'glugun-esbuild',
  setup(build) {
    build.onLoad({ filter: /\.js$/ }, async (args) => {
      let source = await readFile(args.path, 'utf8');

      source = source
        .replace(`const __filename = fileURLToPath(import.meta.url);\r\nconst __dirname = dirname(__filename);`, ''); // remove setting __filename/__dirname cause ESM -> CJS

      source = source.replace(`let CDP;\r\ntry {\r\n  CDP = await import('chrome-remote-interface');\r\n} catch {\r\n  console.warn('Dependencies for Firefox are not installed!');\r\n}\r\n`, supportFirefox ? `import CDP from 'chrome-remote-interface';` : '');

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


global.buildDir = join(__dirname, '..', 'build');
export default async (name, dir) => {
  // reset build dir
  await rm(buildDir, { recursive: true, force: true });
  await mkdir(buildDir, { recursive: true });

  await cp(dir, join(buildDir, 'src'), { recursive: true }); // copy project src to build
  await cp(join(__dirname, '..', 'gluon'), join(buildDir, 'src', 'gluon'), { recursive: true }); // copy gluon into build

  let indexContent = await readFile(join(buildDir, 'src', 'index.js'), 'utf8');
  let gluonContent = await readFile(join(buildDir, 'src', 'gluon', 'index.js'), 'utf8');

  await rm(join(buildDir, 'src', 'gluon', 'node_modules'), { recursive: true, force: true });
  if (supportFirefox) {
    for (const m of [ 'ws', 'chrome-remote-interface' ]) {
    const dest = join(buildDir, 'src', 'gluon', 'node_modules', m);
    await cp(join(__dirname, '..', 'gluon', 'node_modules', m), dest, { recursive: true }); // copy gluon deps into build

    for (const x of await readdir(dest)) {
      if ([ 'bin', 'README.md', 'webpack.config.json', 'browser.js', 'chrome-remote-interface.js' ].includes(x)) await rm(join(dest, x), { recursive: true, force: true });
    }

    if (m === 'chrome-remote-interface') await rm(join(dest, 'lib', 'protocol.json'), { force: true });
    }
  } else {
    await rm(join(buildDir, 'src', 'gluon', 'browser', 'firefox.js'));
    gluonContent = gluonContent.replace(`import Firefox from './browser/firefox.js';`, '');
  }

  // await writeFile(join(buildDir, 'gluon_info.txt'), `Gluon 0.1, built with Glugun 0.1 (win32 ${attrs.join(',')})`);

  indexContent = indexContent.replace('../gluon/', './gluon/');

  await writeFile(join(buildDir, 'src', 'index.js'), indexContent);

  gluonContent = gluonContent.replaceAll('GLUGUN_VERSION', '4.1-dev')
    .replaceAll('EMBEDDED_NODE', embedNode);
    // .replaceAll('SYSTEM_CHROMIUM', attrs.includes('system-chromium'))
    // .replaceAll('SYSTEM_NODE', attrs.includes('system-node'));

  await writeFile(join(buildDir, 'src', 'gluon', 'index.js'), gluonContent)

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

  if (embedNode) {
    log('Embedding Node... (VERY EXPERIMENTAL!)');

    const binary = name + '.exe';
    const hasHtml = false; // await exists(join(buildDir, 'index.html'));

    execSync(`nexe -t 19.2.0 -o "${binary}" ${hasHtml ? `-r "index.html"` : ''} --build -m=without-intl -m=nonpm -m=nocorepack --verbose -i "${minifyBackend ? 'out.js' : join('src', 'index.js')}"`, {
      cwd: buildDir,
      // stdio: 'inherit'
    });

    // execSync(`nexe -t 19.2.0 -o "${join(buildDir, binary)}" --build --verbose -i "${entryPoint}"`, { stdio: 'inherit' });
    if (minifyBinary) execSync(`upx --best --lzma "${join(buildDir, binary)}"`, { stdio: 'inherit' });

    for (const x of await readdir(buildDir)) {
      if (x !== binary && x !== 'index.html') await rm(join(buildDir, x), { recursive: true });
    }
  }
};