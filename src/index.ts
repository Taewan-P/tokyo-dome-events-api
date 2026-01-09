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

// Get the first and last day of the current month in JST
function getMonthRangeJST(): { start: string; end: string } {
  const now = new Date()
  const jstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000)
  
  const year = jstNow.getUTCFullYear()
  const month = jstNow.getUTCMonth()
  
  const firstDay = new Date(Date.UTC(year, month, 1))
  const lastDay = new Date(Date.UTC(year, month + 1, 0))
  
  return {
    start: firstDay.toISOString().split('T')[0],
    end: lastDay.toISOString().split('T')[0]
  }
}

// Get the date range from today through Sunday in JST
function getWeekRangeJST(): { start: string; end: string } {
  const now = new Date()
  const jstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000)
  
  const today = jstNow.toISOString().split('T')[0]
  
  // Get day of week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
  const dayOfWeek = jstNow.getUTCDay()
  
  // Calculate days until Sunday (if today is Sunday, return 0)
  const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek
  
  const sunday = new Date(jstNow.getTime() + daysUntilSunday * 24 * 60 * 60 * 1000)
  const sundayStr = sunday.toISOString().split('T')[0]
  
  return {
    start: today,
    end: sundayStr
  }
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

app.get('/this_month', async (c) => {
  const cache = caches.default
  const cacheKey = new Request(c.req.url, { method: 'GET' })
  
  // Check cache first
  const cachedResponse = await cache.match(cacheKey)
  if (cachedResponse) {
    return cachedResponse
  }
  
  // Cache miss - query D1
  const { start, end } = getMonthRangeJST()
  const { results } = await c.env.TOKYO_DOME_EVENTS_DB
    .prepare('SELECT * FROM events WHERE date >= ? AND date <= ? ORDER BY date')
    .bind(start, end)
    .all()

  // Create response with cache headers
  const ttl = getSecondsUntilMidnightJST()
  const response = c.json(results)
  response.headers.set('Cache-Control', `public, max-age=${ttl}`)
  
  // Store in cache
  c.executionCtx.waitUntil(cache.put(cacheKey, response.clone()))
  
  return response
})

app.get('/this_week', async (c) => {
  const cache = caches.default
  const cacheKey = new Request(c.req.url, { method: 'GET' })
  
  // Check cache first
  const cachedResponse = await cache.match(cacheKey)
  if (cachedResponse) {
    return cachedResponse
  }
  
  // Cache miss - query D1
  const { start, end } = getWeekRangeJST()
  const { results } = await c.env.TOKYO_DOME_EVENTS_DB
    .prepare('SELECT * FROM events WHERE date >= ? AND date <= ? ORDER BY date')
    .bind(start, end)
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
