import { beforeEach, vi, describe, expect, test } from 'vitest'
import { join } from 'node:path'
import { getDataPath } from './getDataPath.js'

describe('getDataPath', () => {
  let spyProcess

  beforeEach(() => {
    spyProcess = vi.spyOn(process, 'cwd')
    spyProcess.mockImplementation(() => 'MY_PATH')
  })

  test('should return path with Gluon', () => {
    expect(getDataPath('gluon')).toEqual(join("MY_PATH", 'gluon_data', 'gluon'))
  })

  test('should return path with Honk', () => {
    expect(getDataPath('honk')).toEqual(join("MY_PATH", 'gluon_data', 'honk'))
  })
})