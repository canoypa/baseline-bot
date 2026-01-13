import * as v from 'valibot'
import { describe, expect, it, vi } from 'vitest'
import { fetchWithParse } from './fetch_with_parse'

describe('fetchWithParse', () => {
  it('parses valid JSON response', async () => {
    const schema = v.object({ ok: v.boolean() })

    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(JSON.stringify({ ok: true }), {
            status: 200,
            headers: { 'content-type': 'application/json' },
          }),
      ),
    )

    await expect(
      fetchWithParse(schema, 'https://example.com'),
    ).resolves.toEqual({
      ok: true,
    })
  })

  it('throws on non-OK response with body snippet', async () => {
    const schema = v.object({ ok: v.boolean() })

    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response('Package version not found', {
            status: 404,
            statusText: 'Not Found',
            headers: { 'content-type': 'text/plain' },
          }),
      ),
    )

    await expect(fetchWithParse(schema, 'https://example.com')).rejects.toThrow(
      /Failed to fetch JSON \(404 Not Found\)/,
    )
  })

  it('throws on invalid JSON with body snippet', async () => {
    const schema = v.object({ ok: v.boolean() })

    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response('Package version not found', {
            status: 200,
            headers: { 'content-type': 'text/plain' },
          }),
      ),
    )

    await expect(fetchWithParse(schema, 'https://example.com')).rejects.toThrow(
      /Invalid JSON response/,
    )
  })
})
