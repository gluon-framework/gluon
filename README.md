<h1 align="center">
<sub><img src="assets/logo.png" height="38" width="38"></sub>
Gluon
</h1>

<span align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://choosealicense.com/licenses/mit)
[![NPM version](https://img.shields.io/npm/v/@gluon-framework/gluon)](https://www.npmjs.com/package/@gluon-framework/gluon)
[![GitHub Sponsors](https://img.shields.io/github/sponsors/CanadaHonk?label=Sponsors&logo=github)](https://github.com/sponsors/CanadaHonk)
[![Discord](https://img.shields.io/discord/1051940602704564244.svg?label=&logo=discord&logoColor=ffffff&color=7389D8&labelColor=6A7EC2)](https://discord.gg/RFtUCA8fST)

</span>

**Gluon is a new framework for creating desktop apps from websites**, using **system installed browsers** *(not webviews)* and NodeJS, differing a lot from other existing active projects - opening up innovation and allowing some major advantages. Instead of other similar frameworks bundling a browser like Chromium or using webviews (like Edge Webview2 on Windows), **Gluon just uses system installed browsers** like Chrome, Edge, Firefox, etc. Gluon supports Chromium ***and Firefox*** based browsers as the frontend, while Gluon's backend uses NodeJS to be versatile and easy to develop (also allowing easy learning from other popular frameworks like Electron by using the same-ish stack).

## Features
- **Uses normal system installed browsers** - allows user choice by **supporting most Chromium *and Firefox*** based browsers,  no webviews
- **Tiny bundle sizes** - <1MB using system Deno
- **Chromium *and Firefox* supported as browser engine**, unlike any other active framework
- **Minimal and easy to use** - Gluon has a simple yet powerful API to make apps with a Node backend
- **Also supports Deno** (experimental) - Deno is also being worked as an option (developer choice) in replacement of NodeJS for the backend (you're here right now)
- **Fast build times** - Gluon has build times under 1 second on most machines for small projects
- **Actively developed** and **listening to feedback** - new updates are coming around weekly, quickly adding unplanned requested features if liked by the community (like Firefox support!)
- **Cross-platform** - Gluon works on Windows, Linux, and macOS (WIP)
<!-- - **No forks needed** - Gluon doesn't need forks of Node or Chromium/etc to use them, it just uses normal versions -->

![Gluworld Screenshot showing Chrome Canary and Firefox Nightly being used at once using Deno.](https://user-images.githubusercontent.com/19228318/210020320-ff62e67f-0eb5-4e9e-989b-3ba4edc0fe35.png)

<br>

## Status
Gluon is currently **barely 1 week old**, so is still in an **early and experimental state**. But it works and shows (in my opinion) potential! I am open to opinions, suggestions, feedback, ideas, etc. Currently you cannot easily test it yourself. If you're interested and want to talk to me and others about Gluon, you can [join our Discord server](https://discord.gg/RFtUCA8fST).

### Specific feature statuses
- Using Chromium based browsers: Stable
- Using Firefox based browsers: Experimental
- Web-Deno IPC: Stable

<br>

## Ecosystem
- [Gluon](https://github.com/gluon-framework/gluon): the Gluon framework (Deno)
- [Glugun](https://github.com/gluon-framework/glugun): builds Gluon apps into releasable builds with optional bundling (soon)

### Apps
- [Gluworld](https://github.com/gluon-framework/examples/tree/main/gluworld): Hello World demo app with version info shown
- [Gludoom](https://github.com/gluon-framework/examples/tree/main/gludoom): Doom running as WASM, made into a native looking app with Gluon
- [Glucord](https://github.com/gluon-framework/examples/tree/main/glucord): minimal desktop Discord client loading official webapp (demo/example)

<br>

## Trying Gluon
1. Clone [the `deno` branch of this repo](https://github.com/gluon-framework/gluon/tree/deno) (`git clone --branch deno https://github.com/gluon-framework/gluon.git`)
2. `deno run -A gluworld/index.js`

<details>
<summary>Shell example</summary>

```sh
$ git clone --branch deno https://github.com/gluon-framework/gluon.git
$ cd gluon
$ deno run -A gluworld/index.js
```

</details>

<br>

<!-- ## IPC API
Gluon has an easy to use, but powerful asynchronous IPC API. Example:
```js
// In your website's JS
const reply = await Gluon.ipc.send('my type', { more: 'data' });
console.log(reply); // { give: 'back', different: 'stuff' }
```

```js
// In your Deno backend
import * as Gluon from '@gluon-framework/gluon';
const Window = await Gluon.open(...);

Window.ipc.on('my type', data => { // { more: 'data' }
  return { give: 'back', different: 'stuff' };
});
```

<br> -->

## Comparisons
### Internals
| Part | Gluon | Electron | Tauri | Neutralinojs |
| ---- | ----- | -------- | ------------ | ----- |
| Frontend | System installed Chromium *or Firefox* | Self-contained Chromium | System installed webview | System installed webview |
| Backend | System installed Deno | Self-contained Node.JS | Native (Rust) | Native (Any) |
| IPC | Window object | Preload | Window object | Window object |
| Status | Early in development | Production ready | Usable | Usable |
| Ecosystem | Integrated | Distributed | Integrated | Integrated |


### Benchmark / Stats
Basic (plain HTML) Hello World demo, measured on up to date Windows 10, on my machine (your experience will probably differ). Used latest stable versions of all frameworks as of 9th Dec 2022. (You shouldn't actually use random stats in benchmarks to compare frameworks, this is more so you know what Gluon is like compared to other similar projects.)

| Stat | Gluon | Electron | Tauri | Neutralinojs |
| ---- | ----- | -------- | ------------ | ----- |
| Build Size | <1MB[^system][^gluon][^1] | ~220MB | ~1.8MB[^system] | ~2.6MB[^system] |
| Memory Usage | ~80MB[^gluon] | ~100MB | ~90MB | ~90MB |
| Backend[^2] Memory Usage | Not measured[^gluon] (Deno) | ~22MB (Node) | ~3MB (Native) | ~3MB (Native) |
| Build Time | ~0.7s[^3] | ~20s[^4] | ~120s[^5] | ~2s[^3][^6] |

*Extra info: All HTML/CSS/JS is unminified (including Gluon). Built in release configuration. All binaries were left as compiled with common size optimizations enabled for that language, no stripping/packing done.*

[^system]: Does not include system installed components.
[^gluon]: Using Chrome as system browser. Early/WIP data, may change in future.

[^1]: *How is Gluon so small?* Since Deno is expected as a system installed component, it is "just" bundled and minified Deno code.
[^2]: Backend like non-Web (not Chromium/WebView2/etc).
[^3]: Includes Node.JS spinup time.
[^4]: Built for win32 zip (not Squirrel) as a fairer comparison.
[^5]: Cold build (includes deps compiling) in release mode.
[^6]: Using `neu build -r`.