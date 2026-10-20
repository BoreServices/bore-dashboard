import type { Plugin } from 'vite'
import { routes } from './api/_routes'

/**
 * Mounts the Vercel serverless handlers inside the Vite dev server so the
 * frontend can be developed against real API routes without `vercel dev`.
 */
export function apiDevServer(): Plugin {
  return {
    name: 'bore-api-dev-server',
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
