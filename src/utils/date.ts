const JST_OFFSET_MS = 9 * 60 * 60 * 1000
const DAY_MS = 24 * 60 * 60 * 1000

/**
 * Get current time in JST
 */
function getJSTNow(): Date {
  return new Date(Date.now() + JST_OFFSET_MS)
}

/**
 * Calculate seconds until midnight JST
 */
export function getSecondsUntilMidnightJST(): number {
  const jstNow = getJSTNow()

  // Get midnight JST (next day 00:00:00)
  const midnightJST = new Date(jstNow)
  midnightJST.setUTCHours(24, 0, 0, 0)

  const secondsUntilMidnight = Math.floor((midnightJST.getTime() - jstNow.getTime()) / 1000)
  return Math.max(secondsUntilMidnight, 60) // Minimum 60 seconds
}

/**
 * Get JST date string (YYYY-MM-DD) with optional day offset
 */
export function getJSTDateString(dayOffset: number = 0): string {
  const jstDate = new Date(Date.now() + JST_OFFSET_MS + dayOffset * DAY_MS)
  return jstDate.toISOString().split('T')[0]
}

/**
 * Get the first and last day of the current month in JST
 */
export function getMonthRangeJST(): { start: string; end: string } {
  const jstNow = getJSTNow()

  const year = jstNow.getUTCFullYear()
  const month = jstNow.getUTCMonth()

  const firstDay = new Date(Date.UTC(year, month, 1))
  const lastDay = new Date(Date.UTC(year, month + 1, 0))

  return {
    start: firstDay.toISOString().split('T')[0],
    end: lastDay.toISOString().split('T')[0],
  }
}

/**
 * Get the date range from today through Sunday in JST
 */
export function getWeekRangeJST(): { start: string; end: string } {
  const jstNow = getJSTNow()
  const today = jstNow.toISOString().split('T')[0]

  // Get day of week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
  const dayOfWeek = jstNow.getUTCDay()

  // Calculate days until Sunday (if today is Sunday, return 0)
  const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek

  const sunday = new Date(jstNow.getTime() + daysUntilSunday * DAY_MS)
  const sundayStr = sunday.toISOString().split('T')[0]

  return {
    start: today,
    end: sundayStr,
  }
}
