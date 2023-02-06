import { MIME_TYPES } from '../constants.js'

export const getMimeType = ext => MIME_TYPES[ext] ?? MIME_TYPES.bin;