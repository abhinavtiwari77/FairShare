import 'dotenv/config'
import { createServer } from 'http'
import { Server } from 'socket.io'
import { createApp } from './app.js'

const port = process.env.PORT || 3001
const app = createApp()
const httpServer = createServer(app)

const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  },
})

io.on('connection', (socket) => {
  socket.on('disconnect', () => {
    // Chat handlers will be added in Phase 6.
  })
})

httpServer.listen(port, () => {
  console.log(`FairShare API listening on http://localhost:${port}`)
})
