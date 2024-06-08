import { describe, expect, it } from 'vitest'
import type { SupportBrowser, SupportStatus, WebFeature } from '../web_features'
import {
  type KvStore,
  getBrowserSupports,
  getNoteContent,
  isStatusChanged,
} from './scheduled'

describe('isStatusChanged', () => {
  it('should return false if the status has not changed', () => {
    const prev: KvStore = {
      baseline: 'high',
      support: ['chrome'],
    }

    const current: SupportStatus = {
      baseline: 'high',
      support: { chrome: '0' },
    }

    expect(isStatusChanged(prev, current)).toBe(false)
  })

  it('should return true if the baseline has changed', () => {
    const prev: KvStore = {
      baseline: false,
      support: [],
    }

    const current: SupportStatus = {
      baseline: 'low',
      support: {},
    }

    expect(isStatusChanged(prev, current)).toBe(true)
  })

  it('should return true if the support has changed', () => {
    const prev: KvStore = {
      baseline: false,
      support: ['chrome'],
    }

    const current: SupportStatus = {
      baseline: false,
      support: { chrome: '0', chrome_android: '0' },
    }

    expect(isStatusChanged(prev, current)).toBe(true)
  })
})

describe('getBrowserSupports', () => {
  it('should return browser support for a feature with all browsers', () => {
    const support: SupportBrowser = {
      chrome: '0',
      chrome_android: '0',
      edge: '0',
      firefox: '0',
      firefox_android: '0',
      safari: '0',
      safari_ios: '0',
    }

    expect(getBrowserSupports(support)).toEqual({
      chrome: true,
      edge: true,
      firefox: true,
      safari: true,
    })
  })

  it('should return browser support for a feature with only chrome', () => {
    const support: SupportBrowser = {
      chrome: '0',
    }

    expect(getBrowserSupports(support)).toEqual({
      chrome: false,
      edge: false,
      firefox: false,
      safari: false,
    })
  })
})

describe('getNoteContent', () => {
  it('should return a note content for a feature with high baseline', () => {
    const feature: WebFeature = {
      name: 'Feature name',
      description: 'Feature description',
      description_html: 'Feature description',
      status: {
        baseline: 'high',
        support: {},
      },
      spec: [],
    }

    expect(getNoteContent(feature)).toBe(`✅ Widely available!

Feature name
----
Feature description
`)
  })

  it('should return a note content for a feature with low baseline', () => {
    const feature: WebFeature = {
      name: 'Feature name',
      description: 'Feature description',
      description_html: 'Feature description',
      status: {
        baseline: 'low',
        support: {},
      },
      spec: [],
    }

    expect(getNoteContent(feature)).toBe(`☑️ Newly available!

Feature name
----
Feature description
`)
  })

  it('should return a note content for a feature with limited availability', () => {
    const feature: WebFeature = {
      name: 'Feature name',
      description: 'Feature description',
      description_html: 'Feature description',
      status: {
        baseline: false,
        support: { chrome: '0', chrome_android: '0' },
      },
      spec: [],
    }

    expect(getNoteContent(feature)).toBe(`⚠️ Limited availability!
Chrome ✅ / Edge ❌ / Firefox ❌ / Safari ❌

Feature name
----
Feature description
`)
  })
})
