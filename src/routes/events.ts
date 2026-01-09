import { Hono } from 'hono'
import type { Bindings } from '../types'
import { withCache } from '../utils/cache'
import { getJSTDateString, getMonthRangeJST, getWeekRangeJST } from '../utils/date'

const events = new Hono<{ Bindings: Bindings }>()

events.get('/today', async (c) => {
  return withCache(c, async () => {
    const dateStr = getJSTDateString(0)
    const { results } = await c.env.TOKYO_DOME_EVENTS_DB
      .prepare('SELECT * FROM events WHERE date = ?')
      .bind(dateStr)
      .all()
    return results
  })
})

events.get('/tomorrow', async (c) => {
  return withCache(c, async () => {
    const dateStr = getJSTDateString(1)
    const { results } = await c.env.TOKYO_DOME_EVENTS_DB
      .prepare('SELECT * FROM events WHERE date = ?')
      .bind(dateStr)
      .all()
    return results
  })
})

events.get('/this_month', async (c) => {
  return withCache(c, async () => {
    const { start, end } = getMonthRangeJST()
    const { results } = await c.env.TOKYO_DOME_EVENTS_DB
      .prepare('SELECT * FROM events WHERE date >= ? AND date <= ? ORDER BY date')
      .bind(start, end)
      .all()
    return results
  })
})

events.get('/this_week', async (c) => {
  return withCache(c, async () => {
    const { start, end } = getWeekRangeJST()
    const { results } = await c.env.TOKYO_DOME_EVENTS_DB
      .prepare('SELECT * FROM events WHERE date >= ? AND date <= ? ORDER BY date')
      .bind(start, end)
      .all()
    return results
  })
})

export default events
