import { Hono } from 'hono'
import type { Bindings } from './env'
import type { MisskeyWebhookMentioned } from './misskey'
import {
  computeRssEtag,
  getRfc1123Date,
  loadRssState,
  renderRssXml,
  type RssState,
} from './services/rss'
import { scheduledTask } from './services/scheduled'
import { webhookMentioned } from './services/webhook_mentioned'
import { webhookSecret } from './webhook_secret_middleware'

const app = new Hono<{ Bindings: Bindings }>()

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

/**
 * GET /rss - RSS 2.0フィードを返すエンドポイント
 *
 * 動作:
 * - KVから直近のRSSアイテム（最低25件、当日25超なら全件）を取得
 * - ETag を計算し、If-None-Match一致時は304を返す
 * - s-maxage=3600でCloudflareエッジに1時間キャッシュさせる
 */
app.get('/rss', async (c) => {
  const state = await loadRssState(c.env)
  const effectiveState: RssState =
    state ??
    ({
      schemaVersion: 1,
      lastUpdatedAt: '0',
      lastBuildDate: getRfc1123Date(new Date(0)),
      items: [],
    } satisfies RssState)

  const etag = computeRssEtag(effectiveState)
  const ifNoneMatch = c.req.header('If-None-Match')

  const headers = {
    'Content-Type': 'application/rss+xml; charset=utf-8',
    'Cache-Control':
      'public, max-age=0, s-maxage=3600, stale-while-revalidate=60',
    ETag: etag,
  }

  // ETag一致で304 Not Modified
  if (ifNoneMatch === etag) {
    return c.body(null, 304, headers)
  }

  const xml = renderRssXml({
    state: effectiveState,
    requestUrl: c.req.url,
    channelTitle: 'baseline-bot',
    channelDescription: 'Detected updates from web-features Baseline data.',
  })

  return c.body(xml, 200, headers)
})

app.post(
  '/webhook/mentioned',
  (c, next) => {
    const middleware = webhookSecret({
      header: 'X-Misskey-Hook-Secret',
      secret: c.env.MISSKEY_WEBHOOK_SECRET,
    })
    return middleware(c, next)
  },
  async (c) => {
    const payload = await c.req.json<MisskeyWebhookMentioned>()
    c.executionCtx.waitUntil(webhookMentioned(payload, c.env))
    return c.text('OK', 200)
  },
)

const scheduled: ExportedHandlerScheduledHandler<Bindings> = async (
  event,
  env,
  c,
) => {
  c.waitUntil(scheduledTask(event, env, c))
}

export default {
  fetch: app.fetch,
  scheduled,
}
