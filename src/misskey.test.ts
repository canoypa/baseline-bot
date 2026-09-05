import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Bindings } from './env'
import { createNote } from './misskey'

const base = { MISSKEY_TOKEN: 'test-token' } as Bindings

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('createNote', () => {
  it('does not touch the network unless MISSKEY_DELIVER is "true"', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    await createNote(base, { text: 'hi' })
    await createNote({ ...base, MISSKEY_DELIVER: 'false' }, { text: 'hi' })
    await createNote({ ...base, MISSKEY_DELIVER: 'production' }, { text: 'hi' })

    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('posts to notes/create with the bearer token when delivering', async () => {
    const fetchMock = vi.fn(
      (_url: string, _init: RequestInit): Promise<Response> =>
        Promise.resolve(
          new Response(JSON.stringify({ createdNote: { id: 'x' } }), {
            status: 200,
            headers: { 'content-type': 'application/json' },
          }),
        ),
    )
    vi.stubGlobal('fetch', fetchMock)

    await createNote(
      { ...base, MISSKEY_DELIVER: 'true' },
      { text: 'hi', visibility: 'home' },
    )

    expect(fetchMock).toHaveBeenCalledOnce()
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('https://misskey.io/api/notes/create')
    expect((init.headers as Record<string, string>).Authorization).toBe(
      'Bearer test-token',
    )
    expect(JSON.parse(init.body as string)).toEqual({
      text: 'hi',
      visibility: 'home',
    })
  })

  it('throws on a non-OK response instead of swallowing it', async () => {
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

    await expect(
      createNote({ ...base, MISSKEY_DELIVER: 'true' }, { text: 'hi' }),
    ).rejects.toThrow(/notes\/create failed: 401/)
  })
})
