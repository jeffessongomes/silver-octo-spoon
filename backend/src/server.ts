import { initializeDatabase } from './database'
import { createApp } from './app'

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000
const DATABASE_URL = process.env.DATABASE_URL ?? './data/painel.db'

async function start(): Promise<void> {
  await initializeDatabase(DATABASE_URL)

  const app = createApp()
  app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`)
  })
}

start().catch((err) => {
  console.error('Falha ao iniciar servidor:', err)
  process.exit(1)
})
