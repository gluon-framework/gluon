import { exec } from 'child_process';
import { log } from '../lib/logger';

const killProcesses = async pids => new Promise(resolve => exec(process.platform !== 'win32' ? `kill -9 ${pids.join(' ')}` : `taskkill /F ${pids.map(x => `/PID ${x}`).join(' ')}`, (e, out) => resolve(out)));

export default async (CDP, { browserEngine, closeHandlers }) => {
  if (browserEngine !== 'chromium') { // current implementation is for chromium-based only
    const warning = () => log(`Warning: Idle API is currently only for Chromium (running on ${browserEngine})`);

    return {
      hibernate: warning,
      sleep: warning,
      wake: warning,
      auto: warning
    };
  }

  const killNonCrit = async () => { // kill non-critical processes to save memory - crashes chromium internally but not fully
    const procs = (await CDP.send('SystemInfo.getProcessInfo', {}, false)).processInfo;
    const nonCriticalProcs = procs.filter(x => x.type !== 'browser'); // browser = the actual main chromium binary

    await killProcesses(nonCriticalProcs.map(x => x.id));
    log(`killed ${nonCriticalProcs.length} processes`);
  };

  const purgeMemory = async () => { // purge most memory we can
    await CDP.send('Memory.forciblyPurgeJavaScriptMemory');
    await CDP.send('HeapProfiler.collectGarbage');
  };

  const getScreenshot = async () => { // get a screenshot a webm base64 data url
    const { data } = await CDP.send(`Page.captureScreenshot`, {
      format: 'webp'
    });

    return `data:image/webp;base64,${data}`;
  };

  const getLastUrl = async () => {
    const history = await CDP.send('Page.getNavigationHistory');
    return history.entries[history.currentIndex].url;
  };


  let wakeUrl, hibernating = false;
  const hibernate = async () => { // hibernate - crashing chromium internally to save max memory. users will see a crash/gone wrong page but we hopefully "reload" quick enough once visible again for not much notice.
    if (hibernating) return;
    // if (process.platform !== 'win32') return sleep(); // sleep instead - full hibernation is windows only for now due to needing to do native things

    hibernating = true;

    const startTime = performance.now();

    wakeUrl = await getLastUrl();

    purgeMemory();
    await killNonCrit();
    purgeMemory();

    log(`hibernated in ${(performance.now() - startTime).toFixed(2)}ms`);
  };

  const sleep = async () => { // light hibernate - instead of killing chromium processes we just navigate to a screenshot of the current page.
    if (hibernating) return;
    hibernating = true;

    const startTime = performance.now();

    wakeUrl = await getLastUrl();

    purgeMemory();

    await CDP.send(`Page.navigate`, {
      url: lastScreenshot
    });

    purgeMemory();

    log(`slept in ${(performance.now() - startTime).toFixed(2)}ms`);
  };


  const wake = async () => { // wake up from hibernation/sleep by navigating to the original page
    if (!hibernating) return;

    const startTime = performance.now();

    await CDP.send('Page.navigate', {
      url: wakeUrl
    });

    log(`began wake in ${(performance.now() - startTime).toFixed(2)}ms`);

    hibernating = false;
  };


  const { windowId } = await CDP.send('Browser.getWindowForTarget');

  let autoEnabled = process.argv.includes('--force-auto-idle'), autoOptions = {
    timeMinimizedToHibernate: 5
  };

  let autoInterval;
  const startAuto = () => {
    if (autoInterval) return; // already started

    let lastState = '', lastStateWhen = performance.now();
    autoInterval = setInterval(async () => {
      const { bounds: { windowState } } = await CDP.send('Browser.getWindowBounds', { windowId });

      if (windowState !== lastState) {
        lastState = windowState;
        lastStateWhen = performance.now();
      }

      if (!hibernating && windowState === 'minimized' && performance.now() - lastStateWhen > autoOptions.timeMinimizedToHibernate * 1000) await hibernate();
        else if (hibernating && windowState !== 'minimized') await wake();
    }, 200);

    log('started auto idle');
  };

  const stopAuto = () => {
    if (!autoInterval) return; // already stopped

    clearInterval(autoInterval);
    autoInterval = null;

    log('stopped auto idle');
  };


  let lastScreenshot, takingScreenshot = false;
  const screenshotInterval = setInterval(async () => {
    if (takingScreenshot) return;

    takingScreenshot = true;
    lastScreenshot = await getScreenshot();
    takingScreenshot = false;
  }, 10000);

  getScreenshot().then(x => lastScreenshot = x);

  closeHandlers.push(() => {
    clearInterval(screenshotInterval);
    stopAuto();
  });


  log(`idle API active (window id: ${windowId})`);
  if (autoEnabled) startAuto();

  return {
    hibernate,
    sleep,
    wake,

    auto: (enabled, options) => {
      autoEnabled = enabled;

      autoOptions = {
        ...options,
        ...autoOptions
      };

      if (enabled) startAuto();
        else stopAuto();
    }
  };
};