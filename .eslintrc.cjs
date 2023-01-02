export default {
  root: true,
  globals: {
    log: 'readonly'
  },
  parserOptions: {
    sourceType: 'module',
    ecmaVersion: 'latest'
  },
  extends: ['standard'],
  env: {
    es2022: true,
    browser: true,
    worker: true,
    node: true,
    serviceworker: true
  }
}
