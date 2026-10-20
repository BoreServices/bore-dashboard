import type { Plugin } from 'vite'
import { loadEnv } from 'vite'
import { routes } from './api/_routes'

/**
 * Mounts the Vercel serverless handlers inside the Vite dev server so the
 * frontend can be developed against real API routes without `vercel dev`.
 */
export function apiDevServer(): Plugin {
  return {
    name: 'bore-api-dev-server',
    configResolved(config) {
      // The API handlers read process.env directly, so the .env files have to
      // be loaded into it for local development.
      const loaded = loadEnv(config.mode, config.root, '')
      for (const [key, value] of Object.entries(loaded)) {
        if (process.env[key] === undefined) process.env[key] = value
      }
    },
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const path = (req.url ?? '').split('?')[0]
        const handler = routes[path]
        if (!handler) return next()
        try {
          await handler(req, res)
        } catch {
          if (!res.headersSent) {
            res.writeHead(500, { 'content-type': 'application/json; charset=utf-8' })
            res.end(JSON.stringify({ error: 'internal_error', message: 'Unexpected server error.' }))
          }
        }
      })
    },
  }
}
