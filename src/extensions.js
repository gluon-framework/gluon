export const _extensions = {
  chromium: [],
  firefox: []
};

const parseArgs = args => args.flatMap(x => typeof x === 'function' ? x() : x);

export const add = (..._args) => {
  const args = parseArgs(_args);

  for (const ext of args) {
    if (ext.chromium) _extensions.chromium.push(ext.chromium);
    if (ext.firefox) _extensions.firefox.push(ext.firefox);
  }
};

export const remove = (..._args) => {
  const args = parseArgs(_args);

  for (const ext of args) {
    if (ext.chromium) _extensions.chromium.splice(_extensions.chromium.indexOf(ext.chromium), 1);
    if (ext.firefox) _extensions.firefox.splice(_extensions.firefox.indexOf(ext.firefox), 1);
  }
};