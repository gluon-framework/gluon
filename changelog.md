# Gluon Changelog

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