import type { AppContext } from '../types'
import { getSecondsUntilMidnightJST } from './date'

/**
 * Wrapper for cached responses with TTL until midnight JST
 */
export async function withCache<T>(
  c: AppContext,
  queryFn: () => Promise<T>
): Promise<Response> {
  const cache = caches.default
  const cacheKey = new Request(c.req.url, { method: 'GET' })

  // Check cache first
  const cachedResponse = await cache.match(cacheKey)
  if (cachedResponse) {
    return cachedResponse
  }

  // Cache miss - execute query
  const data = await queryFn()

  // Create response with cache headers
  const ttl = getSecondsUntilMidnightJST()
  const response = c.json(data)
  response.headers.set('Cache-Control', `public, max-age=${ttl}`)

  // Store in cache
  c.executionCtx.waitUntil(cache.put(cacheKey, response.clone()))

  return response
}
