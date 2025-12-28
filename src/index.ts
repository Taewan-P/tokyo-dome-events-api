import { Hono } from 'hono'

type Bindings = {
  TOKYO_DOME_EVENTS_DB: {
    prepare(query: string): {
      bind(...values: unknown[]): {
        all<T = Record<string, unknown>>(): Promise<{ results: T[] }>
      }
    }
  }
}

const app = new Hono<{ Bindings: Bindings }>()

app.get('/', (c) => {
  return c.text('ping')
})

app.get('/today', async (c) => {
  // Calculate JST date (UTC+9)
  const now = new Date()
  const jstDate = new Date(now.getTime() + 9 * 60 * 60 * 1000)
  const dateStr = jstDate.toISOString().split('T')[0]

  // Query D1
  const { results } = await c.env.TOKYO_DOME_EVENTS_DB
    .prepare('SELECT * FROM events WHERE date = ?')
    .bind(dateStr)
    .all()

  return c.json(results)
})

app.notFound((c) => {
  return c.json({ error: 'Not Found' }, 404)
})

export default app
