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

// Calculate seconds until midnight JST
function getSecondsUntilMidnightJST(): number {
  const now = new Date()
  const jstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000)
  
  // Get midnight JST (next day 00:00:00)
  const midnightJST = new Date(jstNow)
  midnightJST.setUTCHours(24, 0, 0, 0) // Next midnight in current JST day
  
  const secondsUntilMidnight = Math.floor((midnightJST.getTime() - jstNow.getTime()) / 1000)
  return Math.max(secondsUntilMidnight, 60) // Minimum 60 seconds
}

// Get JST date string with optional day offset
function getJSTDateString(dayOffset: number = 0): string {
  const now = new Date()
  const jstDate = new Date(now.getTime() + 9 * 60 * 60 * 1000 + dayOffset * 24 * 60 * 60 * 1000)
  return jstDate.toISOString().split('T')[0]
}

app.get('/', (c) => {
  return c.text('ping')
})

app.get('/today', async (c) => {
  const cache = caches.default
  const cacheKey = new Request(c.req.url, { method: 'GET' })
  
  // Check cache first
  const cachedResponse = await cache.match(cacheKey)
  if (cachedResponse) {
    return cachedResponse
  }
  
  // Cache miss - query D1
  const dateStr = getJSTDateString(0)
  const { results } = await c.env.TOKYO_DOME_EVENTS_DB
    .prepare('SELECT * FROM events WHERE date = ?')
    .bind(dateStr)
    .all()

  // Create response with cache headers
  const ttl = getSecondsUntilMidnightJST()
  const response = c.json(results)
  response.headers.set('Cache-Control', `public, max-age=${ttl}`)
  
  // Store in cache (clone because response can only be read once)
  c.executionCtx.waitUntil(cache.put(cacheKey, response.clone()))
  
  return response
})

app.get('/tomorrow', async (c) => {
  const cache = caches.default
  const cacheKey = new Request(c.req.url, { method: 'GET' })
  
  // Check cache first
  const cachedResponse = await cache.match(cacheKey)
  if (cachedResponse) {
    return cachedResponse
  }
  
  // Cache miss - query D1
  const dateStr = getJSTDateString(1)
  const { results } = await c.env.TOKYO_DOME_EVENTS_DB
    .prepare('SELECT * FROM events WHERE date = ?')
    .bind(dateStr)
    .all()

  // Create response with cache headers
  const ttl = getSecondsUntilMidnightJST()
  const response = c.json(results)
  response.headers.set('Cache-Control', `public, max-age=${ttl}`)
  
  // Store in cache
  c.executionCtx.waitUntil(cache.put(cacheKey, response.clone()))
  
  return response
})

app.notFound((c) => {
  return c.json({ error: 'Not Found' }, 404)
})

export default app
