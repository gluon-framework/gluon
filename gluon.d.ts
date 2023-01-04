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
    params?: Object,

    /** Send session ID with the command (default true). */
    useSessionId?: Boolean = true
  ): Promise<any>
};

type IdleAutoOptions = {
  /**
   * How long the window should be minimized before hibernating, in seconds.
   * @default 5
   */
  timeMinimizedToHibernate?: Number
};

type IdleApi = {
  /** Put the window into hibernation. */
  hibernate(): Promise<void>,

  /**
   * Put the window to sleep.
   */
  sleep(): Promise<void>,

  /** Wake up the window from hibernation or sleep. */
  wake(): Promise<void>,

  /** Enable/disable automatic idle management, and set its options. */
  auto(
    /** Whether to use automatic idle management. */
    enabled: Boolean,

    /** Set options for automatic behavior. */
    options?: IdleAutoOptions
  ): void
};

type VersionInfo = {
  /** Name of component. */
  name: string,

  /** Full version of component. */
  version: string,

  /** Major version of component as a number. */
  major: number
};

type BrowserVersions = {
  /**
   * Product (browser) version and name.
   * @example
   * Window.versions.product // { name: 'Chrome Canary', version: '111.0.5513.0', major: 111 }
   */
  product: VersionInfo,

  /**
   * Browser engine (Chromium/Firefox) version and name.
   * @example
   * Window.versions.engine // { name: 'chromium', version: '111.0.5513.0', major: 111 }
   */
  engine: VersionInfo,

  /**
   * JS engine (V8/SpiderMonkey) version and name.
   * @example
   * Window.versions.jsEngine // { name: 'v8', version: '11.1.86', major: 11 }
   */
  jsEngine: VersionInfo
};

type ControlsApi = {
  /** Minimize the browser window. */
  minimize(): Promise<void>,

  /**
   * Maximize the browser window.
   * Doesn't make the window appear (use show() before as well).
   */
  maximize(): Promise<void>,

  /** Show (unminimize) the browser window. */
  show(): Promise<void>
}

type Window = {
  /** API for accessing the window itself. */
  window: WindowApi,

  /** API for IPC. */
  ipc: IPCApi,

  /** API for manually using CDP with the browser. */
  cdp: CDPApi,

  /**
   * API for Gluon idle management (like hibernation).
   * @experimental
   */
  idle: IdleApi,

  /** Browser version info of the window: product (browser), engine (Chromium/Firefox), and JS engine (V8/SpiderMonkey). */
  versions: BrowserVersions,

  /** Control (minimize, maximize, etc) the browser window. */
  controls: ControlsApi,

  /** Close the Gluon window. */
  close(): void
};


/** A browser that Gluon supports. */
type Browser =
  'chrome'|'chrome_beta'|'chrome_dev'|'chrome_canary'|
  'chromium'|'chromium_snapshot'|
  'edge'|'edge_beta'|'edge_dev'|'edge_canary'|
  'firefox'|'firefox_nightly'|
  'thorium'|
  'librewolf';

/** A browser engine that Gluon supports. */
type BrowserEngine = 'chromium'|'firefox';


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