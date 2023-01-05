import * as Gluon from '../mod.ts';

const __dirname = new URL(".", import.meta.url).pathname;

const dirSize = async dir => {
  const files = Array.from(await Deno.readDir(dir, { withFileTypes: true }));

  const paths = files.map(async file => {
    const path = `${dir}/${file.name}`;

    if (file.isDirectory()) return await dirSize(path);
    if (file.isFile()) return (await Deno.stat(path)).size;

    return 0;
  });

  return (await Promise.all(paths)).flat(Infinity).reduce((acc, x) => acc + x, 0);
};

(async () => {
  const browsers = Deno.args.slice(1).filter(x => !x.startsWith('-'));

  if (browsers.length > 0) { // use argv as browsers to use
    for (const forceBrowser of browsers) {
      await Gluon.open(new URL(`file://${__dirname}/index.html`).href, {
        windowSize: [ 800, 500 ],
        forceBrowser
      });
    }

    return;
  }

  const Browser = await Gluon.open(new URL(`file://${__dirname}/index.html`).href, {
    windowSize: [ 800, 500 ]
  });

  // const buildSize = await dirSize(__dirname);
  // Chromium.ipc.send('build size', buildSize);
})();