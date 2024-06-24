import { describe, expect, it } from 'vitest'
import type { SupportBrowser, WebFeature, WebFeatures } from '../web_features'
import {
  getBrowserSupports,
  getNoteContent,
  getUpdatedFeatures,
} from './scheduled'

describe('getUpdatedFeatures', () => {
  it('should return empty array when there are no updates', () => {
    const previousFeatures: WebFeatures = {
      'feature-1': {
        name: 'Feature 1',
        description: 'Feature 1 description',
        description_html: 'Feature 1 description',
        status: {
          baseline: 'high',
          support: {},
        },
        spec: [],
      },
      'feature-2': {
        name: 'Feature 2',
        description: 'Feature 2 description',
        description_html: 'Feature 2 description',
        status: {
          baseline: 'low',
          support: { chrome: '0' },
        },
        spec: [],
      },
    }

    const latestFeatures: WebFeatures = {
      'feature-1': {
        name: 'Feature 1',
        description: 'Feature 1 description',
        description_html: 'Feature 1 description',
        status: {
          baseline: 'high',
          support: {},
        },
        spec: [],
      },
      'feature-2': {
        name: 'Feature 2',
        description: 'Feature 2 description',
        description_html: 'Feature 2 description',
        status: {
          baseline: 'low',
          support: { chrome: '0' },
        },
        spec: [],
      },
    }

    expect(getUpdatedFeatures(previousFeatures, latestFeatures)).toEqual([])
  })

  it('should return updated features when there are baseline updates', () => {
    const previousFeatures: WebFeatures = {
      'feature-1': {
        name: 'Feature 1',
        description: 'Feature 1 description',
        description_html: 'Feature 1 description',
        status: {
          baseline: 'low',
          support: {},
        },
        spec: [],
      },
      'feature-2': {
        name: 'Feature 2',
        description: 'Feature 2 description',
        description_html: 'Feature 2 description',
        status: {
          baseline: false,
          support: {},
        },
        spec: [],
      },
    }

    const latestFeatures: WebFeatures = {
      'feature-1': {
        name: 'Feature 1',
        description: 'Feature 1 description',
        description_html: 'Feature 1 description',
        status: {
          baseline: 'high',
          support: {},
        },
        spec: [],
      },
      'feature-2': {
        name: 'Feature 2',
        description: 'Feature 2 description',
        description_html: 'Feature 2 description',
        status: {
          baseline: 'low',
          support: {},
        },
        spec: [],
      },
    }

    expect(getUpdatedFeatures(previousFeatures, latestFeatures)).toEqual([
      {
        name: 'Feature 1',
        description: 'Feature 1 description',
        description_html: 'Feature 1 description',
        status: {
          baseline: 'high',
          support: {},
        },
        spec: [],
      },
      {
        name: 'Feature 2',
        description: 'Feature 2 description',
        description_html: 'Feature 2 description',
        status: {
          baseline: 'low',
          support: {},
        },
        spec: [],
      },
    ])
  })

  it('should return updated features when there are browser support updates', () => {
    const previousFeatures: WebFeatures = {
      'feature-1': {
        name: 'Feature 1',
        description: 'Feature 1 description',
        description_html: 'Feature 1 description',
        status: {
          baseline: false,
          support: {},
        },
        spec: [],
      },
    }

    const latestFeatures: WebFeatures = {
      'feature-1': {
        name: 'Feature 1',
        description: 'Feature 1 description',
        description_html: 'Feature 1 description',
        status: {
          baseline: false,
          support: { chrome: '0' },
        },
        spec: [],
      },
    }

    expect(getUpdatedFeatures(previousFeatures, latestFeatures)).toEqual([
      {
        name: 'Feature 1',
        description: 'Feature 1 description',
        description_html: 'Feature 1 description',
        status: {
          baseline: false,
          support: { chrome: '0' },
        },
        spec: [],
      },
    ])
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
      spec: 'https://example.com',
    }

    expect(getNoteContent(feature)).toBe(`Feature name

✅ Widely available!
----
Feature description

spec: https://example.com`)
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
      spec: 'https://example.com',
    }

    expect(getNoteContent(feature)).toBe(`Feature name

☑️ Newly available!
----
Feature description

spec: https://example.com`)
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
      spec: 'https://example.com',
    }

    expect(getNoteContent(feature)).toBe(`Feature name

⚠️ Limited availability!
Chrome ✅ / Edge ❌ / Firefox ❌ / Safari ❌
----
Feature description

spec: https://example.com`)
  })

  it('should return a note content with multiple specs', () => {
    const feature: WebFeature = {
      name: 'Feature name',
      description: 'Feature description',
      description_html: 'Feature description',
      status: {
        baseline: 'high',
        support: {},
      },
      spec: ['https://1.example.com', 'https://2.example.com'],
    }

    expect(getNoteContent(feature)).toBe(`Feature name

✅ Widely available!
----
Feature description

spec:
    - https://1.example.com
    - https://2.example.com`)
  })

  it('should return a note content with caniuse', () => {
    const feature: WebFeature = {
      name: 'Feature name',
      description: 'Feature description',
      description_html: 'Feature description',
      status: {
        baseline: 'high',
        support: {},
      },
      spec: 'https://example.com',
      caniuse: 'https://caniuse.exmaple.com',
    }

    expect(getNoteContent(feature)).toBe(`Feature name

✅ Widely available!
----
Feature description

caniuse: https://caniuse.exmaple.com
spec: https://example.com`)
  })
})
