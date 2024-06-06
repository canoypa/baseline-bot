import { Hono } from 'hono'

const app = new Hono()

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

const scheduledTask = async (
  _controller: ScheduledController,
  _env: unknown,
  _c: ExecutionContext,
) => {
  // TODO
}

const scheduled: ExportedHandlerScheduledHandler = async (
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
