# Gluon Changelog

## [v0.12.0 - 2023-01-28](https://gluonjs.org/blog/gluon-v0.12/)

## [v0.11.0 - 2023-01-08](https://gluonjs.org/blog/gluon-v0.11/)

## v0.10.1 - 2023-01-07
- Fixed IPC exposed functions being called with arguments incorrectly
- Fixed onLoad causing errors in Node

## [v0.10.0 - 2023-01-05](https://gluonjs.org/blog/gluon-v0.10/)

## [v0.9.0 - 2023-01-03](https://gluonjs.org/blog/gluon-v0.9/)

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