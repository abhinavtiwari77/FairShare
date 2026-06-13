import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import routes from './routes/index.js'

export function createApp() {
  const app = express()

  app.use(
    cors({
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      credentials: true,
    }),
  )
  app.use(express.json())
  app.use(cookieParser())
  app.use('/api/v1', routes)

  app.use((err, _req, res, _next) => {
    console.error(err)
    res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
    })
  })

  return app
}
