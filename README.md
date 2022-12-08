# Gluon
Library and self-contained ecosystem for making "desktop apps" from websites easily using Chromium and NodeJS. Uses system installed Chromium and NodeJS. ***VERY*** early and probably never finished/production ready. *Not* an Electron alternative, mostly.

<br>

## Ecosystem
- [Gluon](gluon): the Gluon library
- [Glugun](glugun): builds Gluon apps into releasable builds with optional bundling

### Apps
- [Glucord](glucord): minimal Discord client loading official webapp (demo/example)


## "Comparison"
| Part | Electron | Gluon |
| ---- | -------- | ----- |
| Frontend | Self-contained Chromium | System Installed Chromium |
| Backend | Self-contained Node.JS | System Installed Node.JS |
| IPC | Electron's Internal API | Gluon's API via CDP |

| Stat | Electron | Gluon |
| ---- | -------- | ----- |
| Build Size | ~190MB | ~2MB[^1] |

[^1]: Does not include system installed components


## Release Schedule
Gluon (and it's subprojects) use a `major.patch` version format, with major releases being released at ~22:00 UTC daily if there are changes present in `main`, while using `X.0-dev` in the meantime. Patch releases may happen inbetween to fix bugs (not adding anything new or breaking).