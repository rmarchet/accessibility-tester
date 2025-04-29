import { JSDOM } from 'jsdom'
import axe from 'axe-core'
import { createCanvas } from 'canvas'
import colorContrastService from './colorContrastService'

export class AccessibilityService {
  constructor(contrastService = colorContrastService) {
    this.contrastService = contrastService;
  }

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

      const axeResults = await axe.run(document, {
        resultTypes: ['violations', 'passes'],
        selectors: true,
      })

      const contrastResults = this.contrastService.runCustomContrastTests(window, document)

      const mergedResults = this.mergeResults(axeResults, contrastResults)

      const formattedResults = formatResults(mergedResults)

      return formattedResults
    } catch (error) {
      console.error('Error running accessibility tests:', error)
      throw error
    } finally {
      delete global.window
      delete global.document
    }
  }

  mergeResults(axeResults, contrastResults) {
    return {
      passes: [...axeResults.passes, ...contrastResults.passes],
      violations: [...axeResults.violations, ...contrastResults.violations],
    }
  }
}

export const formatResults = (results) => ({
  passes: results.passes.map(pass => ({
    id: pass.id,
    description: pass.description,
    help: pass.help,
    helpUrl: pass.helpUrl,
    tags: pass.tags,
    wcag: extractWcagInfo(pass.tags),
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
    wcag: extractWcagInfo(violation.tags),
    nodes: violation?.nodes?.map(node => ({
      html: node.html,
      failureSummary: node.failureSummary,
      target: node.target
    }))
  })),
  summary: {
    passed: results.passes.length,
    violations: results.violations.length,
    total: results.passes.length + results.violations.length,
    wcag: generateWcagSummary([...results.passes, ...results.violations]),
  }
})

export const extractWcagInfo = (tags) => {
  if (!tags || !Array.isArray(tags)) return [];
  
  // Pattern to recognize WCAG levels and criteria
  const wcagPattern = /^wcag(\d+)([a]+)$/;
  const criteriaPattern = /^wcag(\d+)(\d+)(\d+)$/;
  
  const wcagInfo = [];
  
  // Extract WCAG Levels A, AA, AAA
  tags.forEach(tag => {
    // Check all the levels (wcag2a, wcag2aa, wcag21a, wcag21aa)
    const levelMatch = tag.match(wcagPattern);
    if (levelMatch) {
      const version = levelMatch[1].length > 1 
        ? `${levelMatch[1][0]}.${levelMatch[1].slice(1)}` 
        : levelMatch[1];
      const level = levelMatch[2].toUpperCase();
      wcagInfo.push({
        type: 'level',
        version: `WCAG ${version}`,
        level: level
      });
    }

    // Check specific criteria (wcag21a, wcag21aa)
    const criteriaMatch = tag.match(criteriaPattern);
    if (criteriaMatch) {
      const version = criteriaMatch[1].length > 1 
        ? `${criteriaMatch[1][0]}.${criteriaMatch[1].slice(1)}` 
        : criteriaMatch[1];
      const criterionNumber = `${criteriaMatch[2]}.${criteriaMatch[3]}`;
      wcagInfo.push({
        type: 'criterion',
        version: `WCAG ${version}`,
        criterion: criterionNumber
      });
    }
  });
  return wcagInfo;
}

export const generateWcagSummary = (rules) => {
  const summary = {
    // Conteggio per versione e livello
    versions: {},
    // Conteggio per criterio
    criteria: {}
  };

  rules?.forEach(rule => {
    const wcagInfo = extractWcagInfo(rule.tags);
    const isPassing = !rule.impact; // Le regole passes non hanno impact
    
    wcagInfo.forEach(info => {
      if (info.type === 'level') {
        // Inizializza la struttura se necessario
        if (!summary.versions[info.version]) {
          summary.versions[info.version] = {};
        }
        if (!summary.versions[info.version][info.level]) {
          summary.versions[info.version][info.level] = {
            total: 0,
            passed: 0,
            violations: 0
          };
        }
        
        // Aggiorna i conteggi
        summary.versions[info.version][info.level].total++;
        if (isPassing) {
          summary.versions[info.version][info.level].passed++;
        } else {
          summary.versions[info.version][info.level].violations++;
        }
      }
      
      if (info.type === 'criterion') {
        const key = `${info.version} ${info.criterion}`;
        if (!summary.criteria[key]) {
          summary.criteria[key] = {
            total: 0,
            passed: 0,
            violations: 0
          };
        }
        
        // Aggiorna i conteggi
        summary.criteria[key].total++;
        if (isPassing) {
          summary.criteria[key].passed++;
        } else {
          summary.criteria[key].violations++;
        }
      }
    });
  });
  
  return summary;
}
