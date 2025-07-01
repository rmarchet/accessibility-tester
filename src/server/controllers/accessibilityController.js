import axios from 'axios'

export class AccessibilityController {
  constructor(accessibilityService) {
    this.accessibilityService = accessibilityService
  }

  async testAccessibility(req, res) {
    const { html, url } = req.body

    if (!html && !url) {
      return res.status(400).json({ error: 'Either HTML content or URL is required' })
    }

    try {
      let htmlContent = html

      // If URL is provided, fetch the HTML content
      if (url && !html) {
        try {
          const response = await axios.get(url, {
            timeout: 10000,
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; AccessibilityTester/1.0)'
            }
          })
          htmlContent = response.data
        } catch (fetchError) {
          return res.status(400).json({ 
            error: `Failed to fetch URL: ${fetchError.message}` 
          })
        }
      }

      const results = await this.accessibilityService.runTests(htmlContent)
      return res.status(200).json(results)
    } catch (error) {
      console.error('Accessibility test error:', error)
      return res.status(500).json({ 
        error: 'An error occurred while testing accessibility'
      })
    }
  }
}
