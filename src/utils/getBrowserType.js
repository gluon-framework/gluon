export const getBrowserType = name => { // todo: not need this

  if (name.startsWith('firefox') || [ 'librewolf', 'waterfox' ].includes(name)) return 'firefox';

  return 'chromium';
};