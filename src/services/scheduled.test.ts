import { afterEach, describe, expect, it, vi } from 'vitest'
import type {
  Features,
  SupportBrowser,
  WebFeatureData,
} from '../core/web_features/schemas/web_feature'
import type { Bindings } from '../env'
import {
  getBrowserSupports,
  getNoteContent,
  getUpdatedFeatures,
  notify,
} from './scheduled'

describe('getUpdatedFeatures', () => {
  it('should return empty array when there are no updates', () => {
    const previousFeatures: Features = {
      'feature-1': {
        kind: 'feature',
        name: 'Feature 1',
        description: 'Feature 1 description',
        description_html: 'Feature 1 description',
        status: {
          baseline: 'high',
          support: {},
        },
        spec: 'https://example.com/feature-1',
      },
      'feature-2': {
        kind: 'feature',
        name: 'Feature 2',
        description: 'Feature 2 description',
        description_html: 'Feature 2 description',
        status: {
          baseline: 'low',
          support: { chrome: '0' },
        },
        spec: 'https://example.com/feature-2',
      },
    }

    const latestFeatures: Features = {
      'feature-1': {
        kind: 'feature',
        name: 'Feature 1',
        description: 'Feature 1 description',
        description_html: 'Feature 1 description',
        status: {
          baseline: 'high',
          support: {},
        },
        spec: 'https://example.com/feature-1',
      },
      'feature-2': {
        kind: 'feature',
        name: 'Feature 2',
        description: 'Feature 2 description',
        description_html: 'Feature 2 description',
        status: {
          baseline: 'low',
          support: { chrome: '0' },
        },
        spec: 'https://example.com/feature-2',
      },
    }

    expect(getUpdatedFeatures(previousFeatures, latestFeatures)).toEqual([])
  })

  it('should return updated features when there are baseline updates', () => {
    const previousFeatures: Features = {
      'feature-1': {
        kind: 'feature',
        name: 'Feature 1',
        description: 'Feature 1 description',
        description_html: 'Feature 1 description',
        status: {
          baseline: 'low',
          support: {},
        },
        spec: 'https://example.com/feature-1',
      },
      'feature-2': {
        kind: 'feature',
        name: 'Feature 2',
        description: 'Feature 2 description',
        description_html: 'Feature 2 description',
        status: {
          baseline: false,
          support: {},
        },
        spec: 'https://example.com/feature-2',
      },
    }

    const latestFeatures: Features = {
      'feature-1': {
        kind: 'feature',
        name: 'Feature 1',
        description: 'Feature 1 description',
        description_html: 'Feature 1 description',
        status: {
          baseline: 'high',
          support: {},
        },
        spec: 'https://example.com/feature-1',
      },
      'feature-2': {
        kind: 'feature',
        name: 'Feature 2',
        description: 'Feature 2 description',
        description_html: 'Feature 2 description',
        status: {
          baseline: 'low',
          support: {},
        },
        spec: 'https://example.com/feature-2',
      },
    }

    expect(getUpdatedFeatures(previousFeatures, latestFeatures)).toEqual([
      {
        featureKey: 'feature-1',
        feature: {
          kind: 'feature',
          name: 'Feature 1',
          description: 'Feature 1 description',
          description_html: 'Feature 1 description',
          status: {
            baseline: 'high',
            support: {},
          },
          spec: 'https://example.com/feature-1',
        },
      },
      {
        featureKey: 'feature-2',
        feature: {
          kind: 'feature',
          name: 'Feature 2',
          description: 'Feature 2 description',
          description_html: 'Feature 2 description',
          status: {
            baseline: 'low',
            support: {},
          },
          spec: 'https://example.com/feature-2',
        },
      },
    ])
  })

  it('should return updated features when there are browser support updates', () => {
    const previousFeatures: Features = {
      'feature-1': {
        kind: 'feature',
        name: 'Feature 1',
        description: 'Feature 1 description',
        description_html: 'Feature 1 description',
        status: {
          baseline: false,
          support: {},
        },
        spec: 'https://example.com/feature-1',
      },
    }

    const latestFeatures: Features = {
      'feature-1': {
        kind: 'feature',
        name: 'Feature 1',
        description: 'Feature 1 description',
        description_html: 'Feature 1 description',
        status: {
          baseline: false,
          support: { chrome: '0' },
        },
        spec: 'https://example.com/feature-1',
      },
    }

    expect(getUpdatedFeatures(previousFeatures, latestFeatures)).toEqual([
      {
        featureKey: 'feature-1',
        feature: {
          kind: 'feature',
          name: 'Feature 1',
          description: 'Feature 1 description',
          description_html: 'Feature 1 description',
          status: {
            baseline: false,
            support: { chrome: '0' },
          },
          spec: 'https://example.com/feature-1',
        },
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
    const feature: WebFeatureData = {
      kind: 'feature',
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
    const feature: WebFeatureData = {
      kind: 'feature',
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
    const feature: WebFeatureData = {
      kind: 'feature',
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
    const feature: WebFeatureData = {
      kind: 'feature',
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
    const feature: WebFeatureData = {
      kind: 'feature',
      name: 'Feature name',
      description: 'Feature description',
      description_html: 'Feature description',
      status: {
        baseline: 'high',
        support: {},
      },
      spec: 'https://example.com',
      caniuse: 'feature-name',
    }

    expect(getNoteContent(feature)).toBe(`Feature name

✅ Widely available!
----
Feature description

caniuse: https://caniuse.com/feature-name
spec: https://example.com`)
  })
})

describe('notify', () => {
  const feature: WebFeatureData = {
    kind: 'feature',
    name: 'Feature name',
    description: 'Feature description',
    description_html: 'Feature description',
    status: {
      baseline: 'high',
      support: {},
    },
    spec: 'https://example.com',
  }
  const updated = [
    { featureKey: 'feature-1', feature },
    { featureKey: 'feature-2', feature },
  ]

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  const run = async (env: Bindings) => {
    vi.useFakeTimers()
    const pending = notify(updated, env)
    await vi.runAllTimersAsync()
    return pending
  }

  it('counts every note as skipped while the gate is closed', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    expect(await run({ MISSKEY_TOKEN: 'test-token' } as Bindings)).toEqual({
      delivered: 0,
      skipped: 2,
    })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('counts delivered notes when the gate is open', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('{}', { status: 200 })),
    )

    expect(
      await run({
        MISSKEY_TOKEN: 'test-token',
        MISSKEY_DELIVER: 'true',
      } as Bindings),
    ).toEqual({ delivered: 2, skipped: 0 })
  })

  it('counts neither when delivery fails, so the version still advances', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response('Unauthorized', {
            status: 401,
            statusText: 'Unauthorized',
          }),
      ),
    )

    expect(
      await run({
        MISSKEY_TOKEN: 'test-token',
        MISSKEY_DELIVER: 'true',
      } as Bindings),
    ).toEqual({ delivered: 0, skipped: 0 })
  })
})
