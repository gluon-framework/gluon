import { join } from 'node:path'

export const getDataPath = browser => join(process.cwd(), 'gluon_data', browser);