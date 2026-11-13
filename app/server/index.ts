import { serve } from '@hono/node-server'
import { app } from './app'
import { loadSeed } from './seed'
import { seedStore } from './store'

const HOST = '127.0.0.1'
const PORT = Number(process.env.PORT ?? 8787)

const seed = await loadSeed()
seedStore(seed)

serve({ fetch: app.fetch, hostname: HOST, port: PORT }, (info) => {
  console.log(`[api] http://${HOST}:${info.port}  已载入 ${seed.length} 条种子动态`)
})
