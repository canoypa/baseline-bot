export type Bindings = {
  KV: KVNamespace

  MISSKEY_TOKEN: string
  MISSKEY_WEBHOOK_SECRET: string

  // "true" のときだけ Misskey に実投稿する。wrangler.toml の [env.production.vars]
  // にしか無いので、wrangler dev / CI には既定で存在しない。
  MISSKEY_DELIVER?: string
}
