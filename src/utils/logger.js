const rgb = (r, g, b, msg) => `\x1b[38;2;${r};${g};${b}m${msg}\x1b[0m`;

export const log = (...args) => console.log(`[${rgb(88, 101, 242, 'Gluon')}]`, ...args);