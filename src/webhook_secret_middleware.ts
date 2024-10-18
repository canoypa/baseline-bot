import { createMiddleware } from 'hono/factory'
import type { Bindings } from './env'
import { secureCompare } from './utils/secure_compare'

type Args = {
  header: string
  secret: string
}

export const webhookSecret = ({ header, secret }: Args) => {
  return createMiddleware<{ Bindings: Bindings }>(async (c, next) => {
    const headerSecret = c.req.header(header)
    if (!headerSecret) {
      return c.text('Bad Request', 400)
    }

    const authorized = await secureCompare(headerSecret, secret)

    if (authorized) {
      await next()
    }

    return c.text('Unauthorized', 401)
  })
}
