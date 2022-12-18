type WindowApi = {
  /**
   * Evaluate a string or function in the web context.
   * @returns Return value of expression given.
   */
  eval: (
    /** String or function to evaluate. */
    expression: string|Function
  ) => Promise<any>
};

type IPCApi = {
  /**
   * Send an IPC event to the web context.
   * @returns Replied event data (null by default).
   */
  send(
    /** Type of event to send. */
    type: string,

    /** Data of event to send. */
    data: any
  ): Promise<any>,

  /**
   * Subscribe to IPC events of a specific type with a callback.
   */
  on(
    /** Type of event to handle. */
    type: string,

    /**
     * Ran whenever an IPC event of type specified is received. Should return optionally with what to reply with.
     * @returns Optionally with what to reply with, otherwise null by default.
     */
    callback: (data: any) => any
  ): void
};

type CDPApi = {
  /**
   * Send a CDP command to the browser.
   * {@link https://chromedevtools.github.io/devtools-protocol/ Chrome DevTools Protocol Documentation}
   * @returns Result of command from browser.
   */
  send(
    /** Method of CDP command. */
    method: string,

    /** Parameters of CDP command. */
    params?: Object
  ): Promise<any>
};

type Window = {
  window: WindowApi,
  ipc: IPCApi,
  cdp: CDPApi
};


/** A browser that Gluon supports. */
type Browser = 'chrome'|'chrome_canary'|'chromium'|'edge'|'firefox'|'firefox_nightly';

/** Additional options for opening */
type OpenOptions = {
  /** Function to evaluate in the web context once loaded. */
  onLoad?: Function,

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
): Promise<Window>;