import { Hono } from 'hono'
import type { Bindings } from './types'
import events from './routes/events'

const app = new Hono<{ Bindings: Bindings }>()

// Health check
app.get('/', (c) => {
  return c.text('ping')
})

// Mount event routes
app.route('/', events)

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not Found' }, 404)
})

export default app
