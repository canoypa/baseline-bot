import { describe, expect, it } from 'vitest'
import { buildPackageUrl } from './utils'

describe('buildPackageUrl', () => {
  it('normalizes path with and without leading slash', () => {
    const a = buildPackageUrl('next', 'package.json')
    const b = buildPackageUrl('next', '/package.json')

    expect(a.toString()).toBe(b.toString())
    expect(a.toString()).toContain('web-features@next/package.json')
  })
})
