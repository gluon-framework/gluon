# Gluon
Minimal library and integrated ecosystem for making "desktop apps" from websites easily using Chromium and NodeJS. Uses system installed Chromium and NodeJS, with optional bundling if you want that too (soon). ***VERY*** early and probably never finished/production ready. *Not* an Electron alternative, mostly.

<br>

## Ecosystem
- [Gluon](gluon): the Gluon library
- [Glugun](glugun): builds Gluon apps into releasable builds with optional bundling (soon)

### Apps
- [Glucord](glucord): minimal Discord client loading official webapp (demo/example)


## Comparison
### Internals
| Part | Electron | Gluon |
| ---- | -------- | ----- |
| Frontend | Self-contained Chromium | System Installed Chromium |
| Backend | Self-contained Node.JS | System Installed Node.JS |
| IPC | Electron's Internal API | Gluon's API via CDP |
| Status | Production ready | Early in development |
| Ecosystem | Distributed (many separate projects) | Integrated |

### Stats
| Stat | Electron | Gluon |
| ---- | -------- | ----- |
| Build Size | ~190MB | ~2MB[^1][^2] |

[^1]: Does not include system installed components
[^2]: Early/WIP data, can be reduced in future


## Release Schedule
Gluon (and it's subprojects) use a `major.patch` version format, with major releases being released at ~22:00 UTC daily if there are changes present in `main`, while using `X.0-dev` in the meantime. Patch releases may happen inbetween to fix bugs (not adding anything new or breaking).