import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import accessibilityRoutes from './routes/accessibility.js'
import fetchUrlRoutes from './routes/fetch-url.js'

dotenv.config()

export const server = () => {
  const __dirname = process.cwd()

  const app = express()
  const PORT = process.env.PORT || 5000
  
  // Middleware
  app.use(cors())
  app.use(express.json({ limit: '10mb' }))
  app.use(express.static(path.join(__dirname, 'public')))
  
  // Routes
  app.use('/api', accessibilityRoutes)
  app.use('/api/fetch-url', fetchUrlRoutes)
  
  // Health check endpoint
  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' })
  })
  
  app.get('/', (req, res) => {
    res.status(200).json({ 
      message: 'Accessibility Tester API',
      version: '0.1.2',
      endpoints: ['/api/test', '/health']
    })
  })
  
  // Start server
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`)
    console.log(`📊 API endpoints available at http://localhost:${PORT}/api`)
  })
}

server()

