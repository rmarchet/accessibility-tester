import { JSDOM } from 'jsdom'
import axe from 'axe-core'
import { createCanvas } from 'canvas'

class AccessibilityService {
  async runTests(html) {
    try {
      const dom = new JSDOM(html, { runScripts: 'dangerously' })
      const { window } = dom
      const { document } = window
      axe.configure({
        rules: [],
        resultTypes: ['violations', 'passes'],
        elementRef: true,
        runOnly: {
          type: 'tag',
          values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice']
        }
      })

      global.window = window
      global.document = document
      window.HTMLCanvasElement.prototype.getContext = function() {
        return createCanvas(300, 150).getContext('2d')
      }
      axe.setup(window.document)

      const results = await axe.run(document, {
        resultTypes: ['violations', 'passes'],
        selectors: true,
      })

      // Format results to match the expected structure
      const formattedResults = {
        passes: results.passes.map(pass => ({
          id: pass.id,
          description: pass.description,
          help: pass.help,
          helpUrl: pass.helpUrl,
          tags: pass.tags,
          nodes: pass.nodes ? pass.nodes.map(node => ({
            html: node.html,
            target: node.target
          })) : []
        })),
        violations: results.violations.map(violation => ({
          id: violation.id,
          impact: violation.impact,
          description: violation.description,
          help: violation.help,
          helpUrl: violation.helpUrl,
          tags: violation.tags,
          nodes: violation.nodes.map(node => ({
            html: node.html,
            failureSummary: node.failureSummary,
            target: node.target
          }))
        })),
        summary: {
          passed: results.passes.length,
          violations: results.violations.length,
          total: results.passes.length + results.violations.length
        }
      }

      return formattedResults
    } catch (error) {
      console.error('Error running accessibility tests:', error)
      throw error
    }
  }
}

export default AccessibilityService
