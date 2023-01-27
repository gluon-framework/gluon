# Gluon Roadmap

> **Note** |
> Want more info on what some of these mean/are? Ask in [our Discord](https://discord.gg/RFtUCA8fST)!

## Backlog
- Shortcut (creation/deletion) API
- Clipboard API
- Custom protocol API
- System tray API
- Browser data (delete) API
- Crash handling API
- Resources/Injection API
- Log file
- Automatically remember window position/size between starts (disableable)


## v0.13.0
- [ ] Initial system tray API (Windows only for WIP)
- [ ] Frameless windows (Windows only for WIP)
- [ ] Hide window completely (Windows only for WIP)

## v0.12.0
- [X] Add new freezing API to Idle API
- [X] Minor stability/edge-case improvements
- [X] Local improvements
- [X] Experimental V8 Cache API
- [X] Massive startup time speedup (~1s -> ~0.4s)
- [X] Tweak and add to Page API

## v0.11.0
- [X] Page title API
- [X] Force browser open option
- [X] Fix first run dialogs opening for Chromium
- [X] Fix some IPC bugs
- [X] Fix Firefox sometimes erroring out
- [X] Fix Chromium first run dialog showing
- [X] Error handling for Page.eval
- [X] IPC Store API
- [X] Massive reliability improvements
- [X] New local file loading/handling API

## v0.10.0
- [X] Rewrite data path generation
- [X] Rewrite browser path generation for Windows and add more browsers
- [X] Clean up logging, minor internal cleanup/simplifying/rewriting
- [X] IPC v2 (Expose API)
- [X] Await page load API

## v0.9.0
- [X] Browser version info API
- [X] Idle API v2
- [X] Mac support
- [X] Window controls API

## v0.8.0
- [X] Rewrite browser detection to support more setups
- [X] Close API

## v0.7.0
- [X] Early Idle Window API