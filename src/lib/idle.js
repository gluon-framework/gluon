import { exec } from 'child_process';

const killProcesses = async pids => process.platform !== 'win32' ? Promise.resolve('') : new Promise(resolve => exec(`taskkill /F ${pids.map(x => `/PID ${x}`).join(' ')}`, (e, out) => resolve(out)));

export default async (CDP, { browserType }) => {
  if (browserType !== 'chromium') { // current implementation is for chromium-based only
    const warning = () => log(`Warning: Idle API is currently only for Chromium (running on ${browserType})`);

    return {
      hibernate: warning,
      sleep: warning,
      wake: warning,
      auto: warning
    };
  };

  const killNonCrit = async () => {
    const procs = (await CDP.send('SystemInfo.getProcessInfo', {}, false)).processInfo;
    const nonCriticalProcs = procs.filter(x => x.type !== 'browser');

    await killProcesses(nonCriticalProcs.map(x => x.id));
    log(`killed ${nonCriticalProcs.length} processes`);
  };

  let hibernating = false;
  const hibernate = async () => {
    hibernating = true;

    const startTime = performance.now();

    await killNonCrit();
    // await killNonCrit();

    log(`hibernated in ${(performance.now() - startTime).toFixed(2)}ms`);
  };

  const wake = async () => {
    const startTime = performance.now();

    await CDP.send('Page.reload');

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

  log(`idle API active (window id: ${windowId})`);
  if (autoEnabled) startAuto();

  return {
    hibernate,
    sleep: () => {},
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