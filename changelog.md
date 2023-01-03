# Gluon Changelog

## v0.9.0 [2023-01-03]
- New `Window.versions` API with browser version info
- New `Window.controls` API to manage window state (minimize/maximize/etc)
- New additions and improvements to `Window.idle`:
  - `Window.idle.sleep()` now performs a light version of hibernation
  - Now uses CDP commands instead of native to detect processes
- Added new `useSessionId` option to `Window.cdp.send()`, allowing to send browser-level CDP commands instead of just to target
- Added initial Mac support

## v0.8.0 [2022-12-30]
- Rewrote browser detection to support more setups
- Added `Window.close()` API to close Gluon windows gracefully

## 0.7.0 [2022-12-20]
- Added typedef
- Added async IPC listener support
- Added Idle API (WIP)
- Changed default IPC replies to `null` instead of `{}`
- Fixed misnamed IPC binding handler
- Fixed some IPC parsing
- Cleaned up some IPC internals