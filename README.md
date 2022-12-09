# Gluon
Minimal integrated ecosystem for making "desktop apps" from websites easily using Chromium and NodeJS. Uses system installed Chromium and NodeJS, with optional bundling if you want that too (soon). ***VERY*** early and probably never finished/production ready. Finds system installed Chromium binary (doesn't use WebView2).

![Gluworld Screenshot](https://user-images.githubusercontent.com/19228318/206796827-5f19addb-a063-4603-b242-6e8f915e8932.png)

<br>

## Ecosystem
- [Gluon](gluon): the Gluon library (NodeJS)
- [Glugun](glugun): builds Gluon apps into releasable builds with optional bundling (soon)

### Apps
- [Gluworld](gluworld): basic Hello World demo app
- [Glucord](glucord): minimal desktop Discord client loading official webapp (demo/example)

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
Basic (plain HTML) Hello World demo, measured on up to date Windows 10. Used latest stable versions of all frameworks as of 9th Dec 2022. (You shouldn't actually use random stats in benchmarks to compare frameworks, this is more so you know what Gluon is like compared to other similar projects.)

| Stat | Gluon | Electron | Tauri | Neutralinojs |
| ---- | ----- | -------- | ------------ | ----- |
| Build Size | ~0.5MB[^system][^gluon][^1] | ~220MB | ~1.8MB[^system] | ~2.6MB[^system] |
| Memory Usage | ~90MB[^gluon] | ~100MB | ~90MB | ~90MB |
| Backend[^2] Memory Usage | ~13MB[^gluon] | ~22MB | ~3MB | ~3MB |
| Build Time | ~0.7s[^3] | ~20s[^4] | ~120s[^5] | ~2s[^3][^6] |

*Extra info: All HTML/CSS/JS is unminified (including Gluon). Built in release configuration. All binaries were left as compiled with common size optimizations enabled for that language, no stripping/packing done.*

[^system]: Does not include system installed components.
[^gluon]: Early/WIP data, may change in future.

[^1]: *How is Gluon so small?* Since NodeJS is expected as a system installed component, it is "just" bundled and minified Node code.
[^2]: Backend like non-Web (not Chromium/WebView2/etc).
[^3]: Includes Node.JS spinup time.
[^4]: Built for win32 zip (not Squirrel) as a fairer comparison
[^5]: Cold build (includes deps compiling) in release mode.
[^6]: Using `neu build -r`
