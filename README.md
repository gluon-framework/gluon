# Gluon
*Not* an Electron alternative, mostly. Library for making "desktop apps" from websites easily using Chromium and NodeJS. Uses system installed Chromium and NodeJS. ***VERY*** early and probably never finished/production ready.

<br>

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
