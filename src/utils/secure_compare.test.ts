import { describe, expect, it } from 'vitest'
import { secureCompare } from './secure_compare'

describe('secure_compare', () => {
  it('should return true if the strings are the same', async () => {
    expect(await secureCompare('foo', 'foo')).toBe(true)
  })

  it('should return false if the strings are different', async () => {
    expect(await secureCompare('foo', 'bar')).toBe(false)
  })
})
