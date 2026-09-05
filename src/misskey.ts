import type { Bindings } from './env'

export type MisskeyWebhookMentioned = {
  body: {
    note: {
      id: string
      visibility: 'public' | 'home' | 'followers' | 'specified'
      text: string | null
    }
  }
}

type CreateNoteParams = {
  text: string
  visibility?: 'public' | 'home' | 'followers' | 'specified'
  replyId?: string
  noExtractMentions?: boolean
}

export const createNote = async (env: Bindings, params: CreateNoteParams) => {
  if (env.MISSKEY_DELIVER !== 'true') {
    console.info(`[misskey] 未配信:\n${params.text}`)
    return
  }

  const res = await fetch('https://misskey.io/api/notes/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.MISSKEY_TOKEN}`,
    },
    body: JSON.stringify(params),
  })

  if (!res.ok) {
    throw new Error(`notes/create failed: ${res.status} ${res.statusText}`)
  }

  return res.json()
}
