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

/**
 * Misskey にノートを1件投稿する。
 *
 * MISSKEY_DELIVER が "true" のときだけ実際に POST し、それ以外は本文をログに出して返る。
 * この目印は [env.production.vars] にしか無く、vars は環境間で継承されないので
 * wrangler dev には存在しない。KV に何を仕込んでどの経路を走らせても、ローカルから
 * @baseline_bot として投稿されることはない。ローカルで実配信を確認したいときだけ
 * .dev.vars に MISSKEY_DELIVER=true を足す。
 */
export const createNote = async (env: Bindings, params: CreateNoteParams) => {
  if (env.MISSKEY_DELIVER !== 'true') {
    console.info(`[misskey] 未配信 (MISSKEY_DELIVER != true):\n${params.text}`)
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
