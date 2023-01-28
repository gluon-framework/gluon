/// <reference types="node" />
declare module "@gluon-framework/gluon";

type V8CacheBuildOptions = {
  /**
   * Path to save the V8 Cache to. Defaults to v8Cache.json in Gluon's browser data.
   */
  path?: string,

  /**
   * Use eager compilation.
   * @default true
   */
  eager?: Boolean,

  /**
   * URLs of scripts to cache. Defaults to automatically detecting currently loaded scripts in the page.
   */
  urls?: string[],

  /**
   * Reload the page to force script compilation.
   * @default true
   */
  reload?: Boolean,

  /**
   * Include preload scripts in automatic detection.
   * @default true
   */
  includePreload?: Boolean
};

type V8CacheApi = {
  /** Build a V8 Cache. */
  build(
    /** Build options. */
    options?: V8CacheBuildOptions
  ): Promise<void>,

  /** Load a V8 Cache. */
  load(
    /**
     * Path to load. Defaults to v8Cache.json in Gluon's browser data.
     */
    path?: string
  ): Promise<boolean>

  /** Check if a V8 Cache exists with a given path. */
  exists(
    /** Path to check. */
    path: string
  ): Promise<Boolean>
};

type PageApi = {
  /**
   * Evaluate a string or function in the web context.
   * @returns Return value of expression given.
   */
  eval(
    /** String or function to evaluate. */
    expression: string|Function
  ): Promise<any>,

  /** Promise for waiting until the page has loaded. */
  loaded: Promise<void>,

  /**
   * Get or set the title of the page.
   * Use no arguments to get the title, or provide a string to set it.
   */
  title(
    /** Set the page title to a new title. */
    newTitle: string
  ): Promise<string>,

  /**
   * Reload the page.
   */
  reload(
    /**
     * Optionally ignore the cache for the reload.
     * @default false
    */
    ignoreCache?: Boolean
  ): Promise<void>,
};

type IPCStoreApi = {
  /** Get a key from the IPC store. */
  get(
    /** Key to get. */
    key: string
  ): any,

  /** Set a key to the provided value in the IPC store (has to be serializable to JSON). */
  set<T>(
    /** Key to set to. */
    key: string,

    /** Value to set. */
    value: T
  ): T,

  /** Get or set a key from the IPC Store (has to be serializable to JSON). */
  [key: string]: any,
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
  ): void,

  /**
   * Unsubscribe an IPC event listener callback with a specific type.
   */
  removeListener(
    /** Type of event which was subscribed to. */
    type: string,

    /** Callback function to unsubscribe. */
    callback: Function
  ): void,

  /**
   * Expose a Node function to the web context, acts as a wrapper around IPC events.
   * Can be ran in window with Gluon.ipc[key](...args)
   */
  expose(
    /** Key name to expose to. */
    key: string,

    /** Handler function which is called from the web context. */
    handler: Function
  ): void,

  /**
   * Unexpose (remove) a Node function previously exposed using expose().
   */
  unexpose(
    /** Key name to unexpose (remove). */
    key: string
  ): void,

  /** IPC Store API. */
  store: IPCStoreApi,

  /**
   * Expose a Node function to the web context, acts as a wrapper around IPC events.
   * Can be ran in window with Gluon.ipc[key](...args)
   */
  [key: string]: any,
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

    /**
     * Send session ID with the command (default true).
     * @default true
     */
    useSessionId?: boolean
  ): Promise<any>,

  /**
   * Hook into a specific CDP method being emitted.
   * @returns Function to unhook/unsubscribe.
   */
  on(
    /** Method of CDP event to hook into. */
    method: string,

    /** Callback to run when the given method is emitted. */
    callback: (message: any) => void,

    /**
     * Unhook once the callback is called the first time.
     * @default false
     */
    once: Boolean
  ): (() => void)
};

type IdleAutoOptions = {
  /**
   * How long the window should be minimized before hibernating, in seconds.
   * @default 5
   */
  timeMinimizedToHibernate?: number
};

type IdleApi = {
  /**
   * Put the window into hibernation.
   * Internally kills the browser to save the most resources possible. Loses page state.
   */
  hibernate(): Promise<void>,

  /**
   * Put the window to sleep.
   * Uses a screenshot of the page instead of the actual page. Loses page state.
   */
  sleep(): Promise<void>,

  /**
   * Freeze the window.
   * Keeps the page but halts most execution and background work. Keeps page state.
   */
  freeze(): Promise<void>,

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

type WindowBounds = {
  /** The offset from the left edge of the screen to the window in pixels. */
  left?: number,

  /** The offset from the top edge of the screen to the window in pixels. */
  top?: number,

  /** The window width in pixels. */
  width?: number,

  /** The window height in pixels. */
  height?: number
};

type ControlsApi = {
  /** Minimize the browser window. */
  minimize(): Promise<void>,

  /**
   * Maximize the browser window.
   * Doesn't make the window appear (use show() before as well).
   */
  maximize(): Promise<void>,

  /** Show (unminimize) the browser window and optionally set the bounds (position/size). */
  show(
    /** Set the bounds (position and/or size) of the browser window optionally as well. */
    bounds?: WindowBounds
  ): Promise<void>
};

type Window = {
  /** API for the page of the window. */
  page: PageApi,

  /** API for IPC. */
  ipc: IPCApi,

  /** API for manually using CDP with the browser. */
  cdp: CDPApi,

  /**
   * API for Gluon idle management (like hibernation). Chromium only.
   * @experimental
   */
  idle: IdleApi,

  /** Browser version info of the window: product (browser), engine (Chromium/Firefox), and JS engine (V8/SpiderMonkey). */
  versions: BrowserVersions,

  /** Control (minimize, maximize, etc) the browser window. */
  controls: ControlsApi,

  /**
   * Interface with V8's Compilation Cache. Chromium only.
   * @experimental
   */
  v8Cache: V8CacheApi,

  /** Close the Gluon window. */
  close(): void,

  /** If the window has been closed or not. */
  closed: Boolean
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

  /** Force Gluon to use a specific browser instead of automatically finding one itself. */
  forceBrowser?: Browser,

  /** Force Gluon to use a specific browser engine instead of automatically finding a browser itself. */
  forceEngine?: BrowserEngine
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
