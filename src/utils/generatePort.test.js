import { describe, expect, test } from 'vitest'
import { generatePort } from './generatePort.js'

describe('generatePort', () => {
  test('should generate 10000', () => {
    const mockMath = Object.create(global.Math);
    mockMath.random = () => 0;
    global.Math = mockMath;

    expect(generatePort()).toEqual(10000)
  })
  test('should generate 60000', () => {
    const mockMath = Object.create(global.Math);
    mockMath.random = () => 0.999999999; // returns a random number from 0 (inclusive) up to but not including 1 (exclusive)
    global.Math = mockMath;

    expect(generatePort()).toEqual(60000)
  })

  test('should generate 1', () => {
    const mockMath = Object.create(global.Math);
    mockMath.random = () => 0.5;
    global.Math = mockMath;

    expect(generatePort([0,1])).toEqual(1)
  })

  test('should generate 50', () => {
    const mockMath = Object.create(global.Math);
    mockMath.random = () => 0.5;
    global.Math = mockMath;

    expect(generatePort([0,100])).toEqual(50)
  })
})