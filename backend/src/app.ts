import express from 'express'
import cors from 'cors'
import { createRouter } from './routes'
import { createDocsRouter, swaggerSpec } from './routes/docs'
import { errorHandlerMiddleware } from './middleware/errorHandler'

export function createApp(): express.Application {
  const app = express()

  const allowedOrigins = (process.env.CORS_ORIGIN ?? 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim())

  app.use(
    cors({
      origin: allowedOrigins,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'X-Client-ID'],
      optionsSuccessStatus: 200,
      maxAge: 86400,
    })
  )

  app.use(express.json())

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' })
  })

  app.use('/api', createRouter())

  if (process.env.SWAGGER_ENABLED !== 'false') {
    app.get('/api-docs.json', (_req, res) => res.json(swaggerSpec))
    app.use('/api-docs', createDocsRouter())
  }

  app.use(errorHandlerMiddleware)

  return app
}
