import { Hono } from 'hono'
import type { Bindings } from './env'
import { scheduledTask } from './services/scheduled'
import { webhookMentioned } from './services/webhook_mentioned'
import { webhookSecret } from './webhook_secret_middleware'

const app = new Hono<{ Bindings: Bindings }>()

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

app.post(
  '/webhook/mentioned',
  (c) =>
    webhookSecret({
      header: 'X-Misskey-Hook-Secret',
      secret: c.env.MISSKEY_WEBHOOK_SECRET,
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
