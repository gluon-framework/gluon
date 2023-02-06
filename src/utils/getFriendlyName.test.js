import { describe, expect, test } from 'vitest'
import { getFriendlyName } from './getFriendlyName.js'

describe('getFriendlyName', () => {
  test('should return Gluon', () => {
    expect(getFriendlyName('gluon')).toEqual("Gluon")
  })

  test('should return Gluon-2.0', () => {
    expect(getFriendlyName('gluon-2.0')).toEqual("Gluon-2.0")
  })

  test('should return Gluon_2.0', () => {
    expect(getFriendlyName('gluon_2.0')).toEqual("Gluon_2.0")
  })

  test('should return Gluon_Night', () => {
    expect(getFriendlyName('gluon_nightly')).toEqual("Gluon Nightly")
  })
})