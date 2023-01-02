export default async (CDP) => {
  const { windowId } = await CDP.send('Browser.getWindowForTarget')

  const setWindowState = async state => await CDP.send('Browser.setWindowBounds', { windowId, bounds: { windowState: state } })

  return {
    minimize: async () => {
      await setWindowState('minimized')
    },

    maximize: async () => {
      await setWindowState('maximized')
    },

    show: async () => {
      await setWindowState('minimized')
      await setWindowState('normal')
    }
  }
}
