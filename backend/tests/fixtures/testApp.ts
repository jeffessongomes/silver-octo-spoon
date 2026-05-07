import { initializeDatabase, closeDatabase } from '../../src/database'
import { createApp } from '../../src/app'
import type { Application } from 'express'

let app: Application | null = null

export async function setupTestApp(): Promise<Application> {
  await initializeDatabase(':memory:')
  app = createApp()
  return app
}

export async function teardownTestApp(): Promise<void> {
  await closeDatabase()
  app = null
}

export function getTestApp(): Application {
  if (!app) throw new Error('Test app not initialized. Call setupTestApp() first.')
  return app
}
