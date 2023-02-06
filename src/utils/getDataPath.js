import { join } from 'node:path'
import { RAN_JS_DIR } from '../constants.js'

export const getDataPath = browser => join(RAN_JS_DIR, 'gluon_data', browser);