import { Hono } from 'hono'

type Bindings = {
  KV: KVNamespace
}

const app = new Hono<{ Bindings: Bindings }>()

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

const scheduledTask = async (
  _controller: ScheduledController,
  _env: Bindings,
  _c: ExecutionContext,
) => {
  // TODO
}

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
