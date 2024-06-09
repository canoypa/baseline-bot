export type MisskeyWebhookMentioned = {
  body: {
    note: {
      id: string
      visibility: 'public' | 'home' | 'followers' | 'specified'
      text: string | null
    }
  }
}
