// Esempio di implementazione lato server
const express = require('express')
const axios = require('axios')
const router = express.Router()

router.post('/fetch', async (req, res) => {
  try {
    const { url } = req.body

    if (!url) {
      return res.status(400).json({ error: 'URL is required' })
    }

    // Check if the URL starts with http:// or https://
    const formattedUrl = (
      !url.startsWith('http://') && !url.startsWith('https://')
    ) ? 'https://' + url : url

    const response = await axios.get(formattedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 Accessibility Checker Bot'
      }
    })

    res.json({ html: response.data })
  } catch (error) {
    console.error('Error fetching URL:', error)
    res.status(500).json({ 
      error: 'Failed to fetch URL',
      message: error.message 
    })
  }
})

module.exports = router
