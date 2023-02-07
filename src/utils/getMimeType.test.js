import { describe, expect, test } from 'vitest'
import { getMimeType } from './getMimeType.js'
import { MIME_TYPES } from '../constants.js'

describe('getMimeType', () => {
  test('should return application/octet-stream', () => {
    expect(getMimeType(null)).toEqual(MIME_TYPES.bin)
  })

  test('should return application/octet-stream', () => {
    expect(getMimeType(undefined)).toEqual(MIME_TYPES.bin)
  })

  test('should return application/octet-stream', () => {
    expect(getMimeType(3)).toEqual(MIME_TYPES.bin)
  })

  Object.entries(MIME_TYPES).map(([key, value]) => {
    test(`should return ${value} when ${key}`, () => {
      expect(getMimeType(key)).toEqual(value)
    })
  })
})