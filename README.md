# Gluon
Minimal integrated ecosystem for making "desktop apps" from websites easily using Chromium and NodeJS. Uses system installed Chromium and NodeJS, with optional bundling if you want that too (soon). ***VERY*** early and probably never finished/production ready. Doesn't use WebView2.

<br>

## Ecosystem
- [Gluon](gluon): the Gluon library (NodeJS)
- [Glugun](glugun): builds Gluon apps into releasable builds with optional bundling (soon)

### Apps
- [Glucord](glucord): minimal Discord client loading official webapp (demo/example)

<br>

## Release Schedule
Gluon (and it's subprojects) use a `major.patch` version format, with major releases being released daily if there are changes present in `main`, while using `X.0-dev` in the meantime. Patch releases may happen inbetween to fix bugs (not adding anything new or breaking).

<br>

## Comparisons
### Internals
| Part | Gluon | Electron | Tauri | Neutralinojs |
| ---- | ----- | -------- | ------------ | ----- |
| Frontend | System installed Chromium | Self-contained Chromium | System installed webview | System installed webview |
| Backend | System installed Node.JS | Self-contained Node.JS | Native (Rust) | Native (Any) |
| IPC | None (WIP) | Preload | Window object | Window object |
| Status | Early in development | "Production ready" | Usable | Usable |
| Ecosystem | Integrated | Distributed | Integrated | Integrated |


### Benchmark / Stats
Basic (plain HTML) Hello World demo, measured on up to date Windows 10. Used latest stable versions of all frameworks as of 9th Dec 2022.

| Stat | Gluon | Electron | Tauri | Neutralinojs |
| ---- | ----- | -------- | ------------ | ----- |
| Build Size | ~0.5MB[^system][^gluon][^1] | ~190MB | ~1.8MB[^system] | ~2.6MB[^system] |
| Memory Usage | ~90MB[^gluon] | ~100MB | ~90MB | ~90MB |
| Backend[^2] Memory Usage | ~13MB[^gluon] | ~22MB | ~3MB | ~3MB |

*Extra info: All HTML/CSS/JS is unminified (including Gluon). Built in release configuration. All binaries were left as compiled with common size optimizations enabled for that language, no stripping/packing done.*

[^system]: Does not include system installed components.
[^gluon]: Early/WIP data, may change in future.

[^1]: *How is Gluon so small?* Since NodeJS is expected as a system installed component, it is "just" bundled and minified Node code.
[^2]: Backend like non-Web (not Chromium/WebView2/etc).