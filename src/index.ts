import { Hono } from 'hono'
import { createMiddleware } from 'hono/factory'
import type { Bindings } from './env'
import { scheduledTask } from './services/scheduled'
import { webhookMentioned } from './services/webhook_mentioned'
import { secureCompare } from './utils/secure_compare'

const app = new Hono<{ Bindings: Bindings }>()

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

app.post(
  '/webhook/mentioned',
  createMiddleware<{ Bindings: Bindings }>(async (c, next) => {
    const secret = c.req.header('X-Misskey-Hook-Secret')
    const authorized =
      secret && (await secureCompare(secret, c.env.MISSKEY_WEBHOOK_SECRET))
    if (!authorized) return c.text('Unauthorized', 401)

    await next()
  }),
  async (c) => {
    c.executionCtx.waitUntil(webhookMentioned(c))
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
