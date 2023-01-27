export default async (CDP) => {
  const { windowId } = await CDP.send('Browser.getWindowForTarget');

  const setWindowState = (state, bounds = {}) => CDP.send('Browser.setWindowBounds', {
    windowId,
    bounds: {
      windowState: state,
      ...bounds
    }
  });

  return {
    minimize: async () => {
      await setWindowState('minimized');
    },

    maximize: async () => {
      await setWindowState('maximized');
    },

    show: async bounds => {
      await setWindowState('minimized');
      await setWindowState('normal');
      if (bounds) await setWindowState(undefined, bounds);
    }
  };
};