class AccessibilityController {
  constructor(accessibilityService) {
    this.accessibilityService = accessibilityService
  }

  async testAccessibility(req, res) {
    const { html } = req.body

    if (!html) {
      return res.status(400).json({ error: 'HTML input is required' })
    }

    try {
      const results = await this.accessibilityService.runTests(html)
      return res.status(200).json(results)
    } catch (error) {
      return res.status(500).json({ 
        error: 'An error occurred while testing accessibility'
      })
    }
  }
}

export default AccessibilityController
