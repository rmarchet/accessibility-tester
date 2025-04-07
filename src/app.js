import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import accessibilityRoutes from './routes/accessibility'
import fetchUrlRoutes from './routes/fetch-url'

dotenv.config()

export const server = () => {
  const __dirname = process.cwd()

  const app = express()
  const PORT = process.env.PORT || 3000
  
  // Middleware
  app.use(cors())
  app.use(express.json({ limit: '10mb' }))
  app.use(express.static(path.join(__dirname, 'public')))
  
  // Routes
  app.use('/api/accessibility', accessibilityRoutes)
  app.use('/api/fetch-url', fetchUrlRoutes)
  
  // Health check endpoint
  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' })
  })
  
  app.get('/frontend', (req, res) => {
    res.sendFile(path.join(__dirname, './public/index.html'))
  })
  
  app.get('/', (req, res) => {
    res.status(405).json({ error: 'METHOD NOT FOUND' })
  })
  
  // Start server
  app.listen(PORT, () => {
    console.log(`Server running on port: ${PORT}`)
    console.log(`Frontend available at the URL: http://localhost:${PORT}/frontend`)
  })
}

server()

