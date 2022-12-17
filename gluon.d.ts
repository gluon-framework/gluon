/** A browser that Gluon supports. */
type Browser = 'chrome'|'chrome_canary'|'chromium'|'edge'|'firefox'|'firefox_nightly';

/** Additional options for opening */
type OpenOptions = {
  /** Function to evaluate in the web context once loaded. */
  onLoad?: function,

  /** Force Gluon to use a browser instead of automatically finding. */
  forceBrowser?: Browser,
};

/**
 * Open a new Gluon window.
 */
export function open(
  /** URL to load in the window. */
  url: string,

  /** Additional options for opening. */
  options: OpenOptions
);