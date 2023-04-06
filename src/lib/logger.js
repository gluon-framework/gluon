const rgb = (r, g, b, msg) => `\x1b[38;2;${r};${g};${b}m${msg}\x1b[0m`;

export const log = (...args) => console.log(`[${rgb(88, 101, 242, 'Gluon')}]`, ...args);
export const logInline = (...args) => process.stdout.write(`[${rgb(88, 101, 242, 'Gluon')}] ${args.map(x => x.toString()).join(' ')}`);

export const dangerousAPI = (func, option, value) => console.warn(`[${rgb(88, 101, 242, 'Gluon')}] ${rgb(250, 120, 20, `Using ${option}: ${value} (${func}) is dangerous`)}`);