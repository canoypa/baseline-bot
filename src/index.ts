import { Hono } from 'hono'
import type { Bindings } from './env'
import { scheduledTask } from './services/scheduled'

const app = new Hono<{ Bindings: Bindings }>()

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

const scheduled: ExportedHandlerScheduledHandler<Bindings> = async (
  controller,
  env,
  c,
) => {
  c.waitUntil(scheduledTask(controller, env, c))
}

export default {
  fetch: app.fetch,
  scheduled,
}
