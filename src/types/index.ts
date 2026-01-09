import type { Context } from 'hono'

export type Bindings = {
  TOKYO_DOME_EVENTS_DB: {
    prepare(query: string): {
      bind(...values: unknown[]): {
        all<T = Record<string, unknown>>(): Promise<{ results: T[] }>
      }
    }
  }
}

export type AppContext = Context<{ Bindings: Bindings }>
