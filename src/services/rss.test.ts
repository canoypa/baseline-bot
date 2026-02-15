import { describe, expect, it } from 'vitest'
import {
  RSS_HARD_MAX_ITEMS,
  RSS_MIN_ITEMS,
  computeRssEtag,
  escapeXml,
  mergeRssItems,
  renderRssXml,
  type RssItem,
  type RssState,
} from './rss'

const makeItem = (id: string): RssItem => ({
  id,
  packageVersion: '1.0.0',
  featureKey: id,
  title: `title-${id}`,
  description: `desc-${id}`,
  pubDate: new Date('2026-01-01T00:00:00Z').toUTCString(),
})

describe('escapeXml', () => {
  it('escapes XML special chars', () => {
    expect(escapeXml(`a&b<c>d"e'f`)).toBe('a&amp;b&lt;c&gt;d&quot;e&apos;f')
  })
})

describe('mergeRssItems', () => {
  it('overwrites with today items when today >= MIN', () => {
    const old: RssState = {
      schemaVersion: 1,
      lastUpdatedAt: 'x',
      lastBuildDate: 'y',
      items: [makeItem('old')],
    }

    const today = Array.from({ length: RSS_MIN_ITEMS }, (_, i) => makeItem(`t${i}`))
    const merged = mergeRssItems(old, today)

    expect(merged.items.length).toBe(RSS_MIN_ITEMS)
    expect(merged.items[0].id).toBe('t0')
  })

  it('caps today items at HARD_MAX', () => {
    const today = Array.from({ length: RSS_HARD_MAX_ITEMS + 5 }, (_, i) =>
      makeItem(`t${i}`),
    )
    const merged = mergeRssItems(null, today)

    expect(merged.items.length).toBe(RSS_HARD_MAX_ITEMS)
    expect(merged.truncatedOriginalCount).toBe(RSS_HARD_MAX_ITEMS + 5)
  })

  it('fills up to MIN using old items when today < MIN', () => {
    const old: RssState = {
      schemaVersion: 1,
      lastUpdatedAt: 'x',
      lastBuildDate: 'y',
      items: Array.from({ length: RSS_MIN_ITEMS }, (_, i) => makeItem(`o${i}`)),
    }

    const today = [makeItem('t0'), makeItem('t1')]
    const merged = mergeRssItems(old, today)

    expect(merged.items.length).toBe(RSS_MIN_ITEMS)
    expect(merged.items[0].id).toBe('t0')
    expect(merged.items[1].id).toBe('t1')
  })

  it('dedupes by id', () => {
    const old: RssState = {
      schemaVersion: 1,
      lastUpdatedAt: 'x',
      lastBuildDate: 'y',
      items: [makeItem('dup'), makeItem('o1'), makeItem('o2')],
    }

    const today = [makeItem('dup')]
    const merged = mergeRssItems(old, today)

    expect(merged.items[0].id).toBe('dup')
    expect(merged.items.find((i) => i.id === 'dup')).toBeTruthy()
    expect(merged.items.filter((i) => i.id === 'dup').length).toBe(1)
  })
})

describe('renderRssXml', () => {
  it('renders channel link but no item link', () => {
    const state: RssState = {
      schemaVersion: 1,
      lastUpdatedAt: '2026-01-01T00:00:00.000Z',
      lastBuildDate: new Date('2026-01-01T00:00:00Z').toUTCString(),
      items: [makeItem('x')],
    }

    const xml = renderRssXml({
      state,
      requestUrl: 'https://example.com/rss',
    })

    expect(xml).toContain('<channel>')
    expect(xml).toContain('<link>https://example.com</link>')
    expect(xml).toContain('<item>')
    expect(xml).not.toContain('<item><link>')
  })

  it('etag is stable with same state', () => {
    const state: RssState = {
      schemaVersion: 1,
      lastUpdatedAt: 'same',
      lastBuildDate: 'same',
      items: [makeItem('x')],
    }

    expect(computeRssEtag(state)).toBe(computeRssEtag(state))
  })
})
