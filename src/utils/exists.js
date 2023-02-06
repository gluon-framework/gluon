import { access } from 'node:fs/promises'

export const exists = path => access(path).then(() => true).catch(() => false);