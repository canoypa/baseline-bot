import type { Bindings } from '../env'
import { type MisskeyWebhookMentioned, createNote } from '../misskey'
import { getNoteContent } from './scheduled'
import { searchFeature } from './search'

export const webhookMentioned = async (
  payload: MisskeyWebhookMentioned,
  env: Bindings,
) => {
  const note = payload.body.note

  // dm には反応しない
  if (note.visibility === 'specified') {
    return
  }

  // ping-pong
  if (note.text?.includes('ping')) {
    await createNote(env, {
      visibility: note.visibility,
      text: 'PONG!',
      replyId: note.id,
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
      await createNote(env, {
        visibility: note.visibility,
        text: 'An internal error occurred.',
        replyId: note.id,
      })
      return
    }

    if (!feature || feature.kind !== 'feature') {
      await createNote(env, {
        visibility: note.visibility,
        text: `No matching feature found for query: ${query}`,
        replyId: note.id,
      })
      return
    }

    await createNote(env, {
      visibility: note.visibility,
      text: getNoteContent(feature),
      replyId: note.id,
    })

    return
  }
}
