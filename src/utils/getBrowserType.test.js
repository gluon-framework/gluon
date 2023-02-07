import { describe, expect, test } from 'vitest'
import { getBrowserType } from './getBrowserType.js'

describe('getBrowserType', () => {
  test('when unknown should return chromium', () => {
    expect(getBrowserType('gluon')).toEqual("chromium")
  })

  test('when firefox should return firefox', () => {
    expect(getBrowserType('firefox')).toEqual("firefox")
  })

  test('when firefox-2.0 should return firefox', () => {
    expect(getBrowserType('firefox-2.0')).toEqual("firefox")
  })

  test('when librewolf should return firefox', () => {
    expect(getBrowserType('librewolf')).toEqual("firefox")
  })

  test('when waterfox should return firefox', () => {
    expect(getBrowserType('waterfox')).toEqual("firefox")
  })
})