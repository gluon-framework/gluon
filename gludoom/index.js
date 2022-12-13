import * as Gluon from '../gluon/index.js';

(async () => {
  // Load existing site with WASM doom
  await Gluon.open(`https://silentspacemarine.com`, {
    windowSize: [ 760, 600 ],
    onLoad: () => {
      // Wait until fully loaded
      setTimeout(() => {
        // Inject CSS to remove border / padding
        const el = document.createElement('style');
        el.appendChild(document.createTextNode(`
body, html, #container, #monitor {
  overflow: hidden;
  max-width: unset;
  margin: 0;
  padding: 0;
  border: 0;
  border-radius: 0;

  width: 100%;
  height: 100%;
}

#monitor:after {
  display: none;
}`));
        document.body.appendChild(el);

        // Force window title to our own
        document.title = `Gludoom (${Gluon.versions.product} ${Gluon.versions.browser})`;
        Object.defineProperty(document, 'title', { get() {}, set() {} });
      }, 1000);
    }
  });
})();