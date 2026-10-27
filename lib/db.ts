import { Pool } from 'pg'
import net from 'net'

// Node 22's Happy Eyeballs races IPv6 first; Neon's pooler v6 addresses are
// unreachable from here and the race times out. Sequential lookups connect via IPv4 instantly.
net.setDefaultAutoSelectFamily?.(false)

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: true,
  max: 5,
  connectionTimeoutMillis: 5000,
})

export default pool
