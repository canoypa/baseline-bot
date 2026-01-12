import type { Context } from 'hono'
import type { Bindings } from '../env'
import type { MisskeyWebhookMentioned } from '../misskey'
import { getNoteContent } from './scheduled'
import { searchFeature } from './search'

export const webhookMentioned = async (c: Context<{ Bindings: Bindings }>) => {
  const payload = await c.req.json<MisskeyWebhookMentioned>()

  const note = payload.body.note

  // dm には反応しない
  if (note.visibility === 'specified') {
    return
  }

  // ping-pong
  if (note.text?.includes('ping')) {
    await fetch('https://misskey.io/api/notes/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${c.env.MISSKEY_TOKEN}`,
      },
      body: JSON.stringify({
        visibility: note.visibility,
        text: 'PONG!',
        replyId: payload.body.note.id,
      }),
    })

    return
  }

  // search
  const queryPattern = /@baseline_bot\s+?(?:\s*\n)?(?<q>.+)/
  const match = note.text?.match(queryPattern)
  if (match && match.groups?.q) {
    const query = match.groups.q

    let feature: Awaited<ReturnType<typeof searchFeature>>
    try {
      feature = await searchFeature(query)
    } catch (error) {
      const content = 'An internal error occurred.'
      await fetch('https://misskey.io/api/notes/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${c.env.MISSKEY_TOKEN}`,
        },
        body: JSON.stringify({
          visibility: note.visibility,
          text: content,
          replyId: note.id,
        }),
      })
      return
    }

    if (!feature || feature.kind !== 'feature') {
      const content = `No matching feature found for query: ${query}`
      await fetch('https://misskey.io/api/notes/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${c.env.MISSKEY_TOKEN}`,
        },
        body: JSON.stringify({
          visibility: note.visibility,
          text: content,
          replyId: note.id,
        }),
      })
      return
    }

    const content = getNoteContent(feature)
    await fetch('https://misskey.io/api/notes/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${c.env.MISSKEY_TOKEN}`,
      },
      body: JSON.stringify({
        visibility: note.visibility,
        text: content,
        replyId: note.id,
      }),
    })

    return
  }
}
