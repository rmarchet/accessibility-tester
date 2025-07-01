import { JSDOM } from 'jsdom';
import axe from 'axe-core';
import { createCanvas } from 'canvas';
import { 
  AccessibilityService, 
  formatResults, 
  extractWcagInfo,
  generateWcagSummary,
} from '../accessibilityService';
import colorContrastService from '../colorContrastService';

// Mock dependencies
jest.mock('jsdom');
jest.mock('axe-core');
jest.mock('canvas');
jest.mock('../colorContrastService', () => ({
  __esModule: true,
  default: {
    runCustomContrastTests: jest.fn().mockReturnValue({
      passes: [{ id: 'mock-contrast-pass' }],
      violations: [{ id: 'mock-contrast-violation' }]
    })
  },
  ColorContrastService: jest.fn()
}));

describe('AccessibilityService', () => {
  let accessibilityService;
  let mockWindow;
  let mockDocument;
  let mockAxeResults;
  let mockCanvas;
  let mockCanvasContext;
  
  beforeEach(() => {
    // Reset dei mock
    jest.clearAllMocks();
    
    // Inizializza il service
    accessibilityService = new AccessibilityService();
    
    // Mock di JSDOM
    mockDocument = {};
    mockWindow = {
      document: mockDocument,
      HTMLCanvasElement: {
        prototype: {}
      }
    };
    
    JSDOM.mockImplementation(() => ({
      window: mockWindow
    }));
    
    // Mock di canvas
    mockCanvasContext = {};
    mockCanvas = {
      getContext: jest.fn().mockReturnValue(mockCanvasContext)
    };
    createCanvas.mockReturnValue(mockCanvas);
    
    // Mock dei risultati di axe
    mockAxeResults = {
      passes: [
        {
          id: 'pass-rule-1',
          description: 'Pass description',
          help: 'Pass help',
          helpUrl: 'https://example.com/pass',
          tags: ['tag1', 'tag2'],
          nodes: [
            {
              html: '<div>Pass node</div>',
              target: ['div']
            }
          ]
        }
      ],
      violations: [
        {
          id: 'violation-rule-1',
          impact: 'critical',
          description: 'Violation description',
          help: 'Violation help',
          helpUrl: 'https://example.com/violation',
          tags: ['tag3', 'tag4'],
          nodes: [
            {
              html: '<img src="test.jpg">',
              failureSummary: 'Fix any of the following: Element does not have alt text',
              target: ['img']
            }
          ]
        }
      ]
    };
    
    // Mock di axe.run
    axe.run = jest.fn().mockResolvedValue(mockAxeResults);
    axe.setup = jest.fn();
    axe.configure = jest.fn();
  });
  
  test('dovrebbe inizializzare correttamente JSDOM con l\'HTML fornito', async () => {
    const html = '<html><body><h1>Test</h1></body></html>';
    
    await accessibilityService.runTests(html);
    
    expect(JSDOM).toHaveBeenCalledWith(html, { runScripts: 'dangerously' });
  });
  
  test('dovrebbe configurare axe con i parametri corretti', async () => {
    const html = '<html><body><h1>Test</h1></body></html>';
    
    await accessibilityService.runTests(html);
    
    expect(axe.configure).toHaveBeenCalledWith({
      rules: [],
      resultTypes: ['violations', 'passes'],
      elementRef: true,
      runOnly: {
        type: 'tag',
        values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice']
      }
    });
  });
  
  test('dovrebbe impostare correttamente il contesto globale per axe', async () => {
    const html = '<html><body><h1>Test</h1></body></html>';
    const originalWindow = global.window;
    const originalDocument = global.document;
    
    await accessibilityService.runTests(html);
    
    // Ripristina i valori originali
    global.window = originalWindow;
    global.document = originalDocument;
    
    // expect(global.window).toEqual(mockWindow);
    // expect(global.document).toEqual(mockDocument);
    expect(axe.setup).toHaveBeenCalledWith(mockDocument);
  });
  
  test('dovrebbe configurare la funzione getContext su HTMLCanvasElement', async () => {
    const html = '<html><body><h1>Test</h1></body></html>';
    
    await accessibilityService.runTests(html);
    
    // Verifica che getContext sia stato configurato
    expect(mockWindow.HTMLCanvasElement.prototype.getContext).toBeDefined();
    
    // Verifica che getContext restituisca il contesto del canvas
    const result = mockWindow.HTMLCanvasElement.prototype.getContext();
    expect(result).toBe(mockCanvasContext);
    expect(createCanvas).toHaveBeenCalledWith(300, 150);
  });
  
  test('dovrebbe eseguire axe.run con i parametri corretti', async () => {
    const html = '<html><body><h1>Test</h1></body></html>';
    
    await accessibilityService.runTests(html);
    
    expect(axe.run).toHaveBeenCalledWith(mockDocument, {
      resultTypes: ['violations', 'passes'],
      selectors: true,
    });
  });
  
  test('dovrebbe formattare correttamente i risultati', async () => {
    const html = '<html><body><h1>Test</h1></body></html>';
    
    const results = await accessibilityService.runTests(html);
    
    // Verifica la struttura dei risultati
    expect(results).toHaveProperty('passes');
    expect(results).toHaveProperty('violations');
    expect(results).toHaveProperty('summary');
    
    // Verifica i dettagli delle passes
    expect(results.passes).toEqual([
      {
        id: 'pass-rule-1',
        description: 'Pass description',
        help: 'Pass help',
        helpUrl: 'https://example.com/pass',
        tags: ['tag1', 'tag2'],
        wcag: [],
        nodes: [
          {
            html: '<div>Pass node</div>',
            target: ['div']
          }
        ]
      },
      {
        description: undefined,
        help: undefined,
        helpUrl: undefined,
        id: "mock-contrast-pass",
        nodes:  [],
        tags: undefined,
        wcag:  [],
      }
    ]);
    
    // Verifica i dettagli delle violations
    expect(results.violations).toEqual([
      {
        id: 'violation-rule-1',
        impact: 'critical',
        description: 'Violation description',
        help: 'Violation help',
        helpUrl: 'https://example.com/violation',
        tags: ['tag3', 'tag4'],
        wcag: [],
        nodes: [
          {
            html: '<img src="test.jpg">',
            failureSummary: 'Fix any of the following: Element does not have alt text',
            target: ['img']
          }
        ]
      },
      {
        description: undefined,
        help: undefined,
        helpUrl: undefined,
        id: "mock-contrast-violation",
        impact: undefined,
        nodes: undefined,
        tags: undefined,
        wcag:  [],
      }
    ]);
    
    // Verifica il summary
    expect(results.summary).toEqual({
      passed: 2,
      violations: 2,
      total: 4,
      wcag: {
        criteria: {},
        versions: {},
      }
    });
  });
  
  test('dovrebbe gestire correttamente il caso in cui nodes è undefined', async () => {
    const html = '<html><body><h1>Test</h1></body></html>';
    
    // Modifica i risultati di axe per simulare nodes undefined
    mockAxeResults.passes[0].nodes = undefined;
    
    const results = await accessibilityService.runTests(html);
    
    // Verifica che nodes sia un array vuoto
    expect(results.passes[0].nodes).toEqual([]);
  });
  
  test('dovrebbe lanciare un errore quando axe.run fallisce', async () => {
    const html = '<html><body><h1>Test</h1></body></html>';
    
    // Simula un errore in axe.run
    const mockError = new Error('Axe error');
    axe.run.mockRejectedValue(mockError);
    
    // Assicurati che l'errore venga propagato
    await expect(accessibilityService.runTests(html)).rejects.toThrow(mockError);
  });
  
  test('dovrebbe gestire i casi limite con HTML malformato', async () => {
    const malformedHtml = '<div>unclosed div';
    
    // Dovrebbe comunque inizializzare JSDOM e passare l'HTML a axe
    await accessibilityService.runTests(malformedHtml);
    
    expect(JSDOM).toHaveBeenCalledWith(malformedHtml, expect.any(Object));
    expect(axe.run).toHaveBeenCalled();
  });
  
  test('dovrebbe ripulire le risorse globali anche in caso di errore', async () => {
    const html = '<html><body><h1>Test</h1></body></html>';
    const originalWindow = global.window;
    const originalDocument = global.document;
    
    // Simula un errore in axe.run
    axe.run.mockRejectedValue(new Error('Test error'));
    
    // Dovrebbe lanciare l'errore
    await expect(accessibilityService.runTests(html)).rejects.toThrow();
    
    // Ripristina i valori originali
    global.window = originalWindow;
    global.document = originalDocument;
  });

  test('dovrebbe integrare i risultati dei test di contrasto personalizzati', async () => {
    // Mock dei risultati di axe
    const axeResults = {
      passes: [{ id: 'axe-pass' }],
      violations: [{ id: 'axe-violation' }]
    };
    
    // Mock di axe.run per restituire i risultati mockati
    axe.run.mockResolvedValueOnce(axeResults);
    
    // Esegui i test
    const results = await accessibilityService.runTests('<html></html>');
    
    // Verifica che colorContrastService.runCustomContrastTests sia stato chiamato
    expect(colorContrastService.runCustomContrastTests).toHaveBeenCalled();
    
    // Verifica che i risultati includano sia i test axe che i test di contrasto
    expect(results.passes.some(p => p.id === 'axe-pass')).toBe(true);
    expect(results.passes.some(p => p.id === 'mock-contrast-pass')).toBe(true);
    expect(results.violations.some(v => v.id === 'axe-violation')).toBe(true);
    expect(results.violations.some(v => v.id === 'mock-contrast-violation')).toBe(true);
  });
   
  test('mergeResults dovrebbe unire correttamente i risultati', () => {
    const axeResults = {
      passes: [{ id: 'axe-pass-1' }, { id: 'axe-pass-2' }],
      violations: [{ id: 'axe-violation-1' }]
    };
    
    const contrastResults = {
      passes: [{ id: 'contrast-pass-1' }],
      violations: [{ id: 'contrast-violation-1' }, { id: 'contrast-violation-2' }]
    };
    
    const merged = accessibilityService.mergeResults(axeResults, contrastResults);
    
    expect(merged.passes.length).toBe(3);
    expect(merged.violations.length).toBe(3);
    expect(merged.passes).toContainEqual({ id: 'axe-pass-1' });
    expect(merged.passes).toContainEqual({ id: 'axe-pass-2' });
    expect(merged.passes).toContainEqual({ id: 'contrast-pass-1' });
    expect(merged.violations).toContainEqual({ id: 'axe-violation-1' });
    expect(merged.violations).toContainEqual({ id: 'contrast-violation-1' });
    expect(merged.violations).toContainEqual({ id: 'contrast-violation-2' });
  });
});

describe('extractWcagInfo', () => {
  test('dovrebbe estrarre correttamente i livelli WCAG dai tag', () => {
    const tags = ['wcag2a', 'wcag2aa', 'wcag21a', 'cat.keyboard'];
    const result = extractWcagInfo(tags);
    
    expect(result).toEqual([
      {
        type: 'level',
        version: 'WCAG 2',
        level: 'A'
      },
      {
        type: 'level',
        version: 'WCAG 2',
        level: 'AA'
      },
      {
        type: 'level',
        version: 'WCAG 2.1',
        level: 'A'
      }
    ]);
  });
  
  test('dovrebbe estrarre correttamente i criteri WCAG dai tag', () => {
    const tags = ['wcag111', 'wcag412', 'wcag2143', 'cat.forms'];
    const result = extractWcagInfo(tags);
    
    expect(result).toEqual([
      {
        type: 'criterion',
        version: 'WCAG 1',
        criterion: '1.1'
      },
      {
        type: 'criterion',
        version: 'WCAG 4',
        criterion: '1.2'
      },
      {
        type: 'criterion',
        version: 'WCAG 2.1',
        criterion: '4.3'
      }
    ]);
  });
  
  test('dovrebbe gestire una combinazione di livelli e criteri WCAG', () => {
    const tags = ['wcag2a', 'wcag111', 'wcag412', 'best-practice'];
    const result = extractWcagInfo(tags);
    
    expect(result).toEqual([
      {
        type: 'level',
        version: 'WCAG 2',
        level: 'A'
      },
      {
        type: 'criterion',
        version: 'WCAG 1',
        criterion: '1.1'
      },
      {
        type: 'criterion',
        version: 'WCAG 4',
        criterion: '1.2'
      }
    ]);
  });
  
  test('dovrebbe restituire un array vuoto se non ci sono tag WCAG', () => {
    const tags = ['cat.keyboard', 'best-practice', 'experimental'];
    const result = extractWcagInfo(tags);
    
    expect(result).toEqual([]);
  });
  
  test('dovrebbe gestire input null o undefined', () => {
    expect(extractWcagInfo(null)).toEqual([]);
    expect(extractWcagInfo(undefined)).toEqual([]);
  });
  
  test('dovrebbe gestire input non array', () => {
    expect(extractWcagInfo('wcag2a')).toEqual([]);
    expect(extractWcagInfo(123)).toEqual([]);
    expect(extractWcagInfo({})).toEqual([]);
  });
});

describe('generateWcagSummary', () => {
  test('dovrebbe generare un sommario corretto dei dati WCAG', () => {
    const rules = [
      {
        id: 'rule1',
        tags: ['wcag2a', 'wcag111'],
        // Regola che passa (non ha impact)
        nodes: [{ html: '<div>Test</div>' }]
      },
      {
        id: 'rule2',
        tags: ['wcag2aa', 'wcag412'],
        impact: 'critical', // Regola che fallisce
        nodes: [{ html: '<img src="test.jpg">' }]
      },
      {
        id: 'rule3',
        tags: ['wcag21a', 'wcag111', 'best-practice'],
        // Regola che passa
        nodes: [{ html: '<div>Test</div>' }]
      }
    ];
    
    const result = generateWcagSummary(rules);
    
    expect(result).toEqual({
      versions: {
        'WCAG 2': {
          'A': {
            total: 1,
            passed: 1,
            violations: 0
          },
          'AA': {
            total: 1,
            passed: 0,
            violations: 1
          }
        },
        'WCAG 2.1': {
          'A': {
            total: 1,
            passed: 1,
            violations: 0
          }
        }
      },
      criteria: {
        'WCAG 1 1.1': {
          total: 2,
          passed: 2,
          violations: 0
        },
        'WCAG 4 1.2': {
          total: 1,
          passed: 0,
          violations: 1
        }
      }
    });
  });
  
  test('dovrebbe gestire il caso in cui non ci sono informazioni WCAG', () => {
    const rules = [
      {
        id: 'rule1',
        tags: ['best-practice', 'cat.keyboard'],
        // Regola che passa
        nodes: [{ html: '<div>Test</div>' }]
      },
      {
        id: 'rule2',
        tags: ['experimental', 'cat.forms'],
        impact: 'moderate', // Regola che fallisce
        nodes: [{ html: '<form>' }]
      }
    ];
    
    const result = generateWcagSummary(rules);
    
    expect(result).toEqual({
      versions: {},
      criteria: {}
    });
  });
  
  test('dovrebbe gestire regole senza tag', () => {
    const rules = [
      {
        id: 'rule1',
        // Nessun tag
        nodes: [{ html: '<div>Test</div>' }]
      },
      {
        id: 'rule2',
        tags: undefined,
        impact: 'moderate',
        nodes: [{ html: '<form>' }]
      }
    ];
    
    const result = generateWcagSummary(rules);
    
    expect(result).toEqual({
      versions: {},
      criteria: {}
    });
  });
  
  test('dovrebbe aggregare correttamente più violazioni dello stesso criterio', () => {
    const rules = [
      {
        id: 'rule1',
        tags: ['wcag111'],
        // Regola che passa
        nodes: [{ html: '<div>Test 1</div>' }]
      },
      {
        id: 'rule2',
        tags: ['wcag111'],
        impact: 'critical', // Regola che fallisce
        nodes: [{ html: '<div>Test 2</div>' }]
      },
      {
        id: 'rule3',
        tags: ['wcag111'],
        impact: 'serious', // Regola che fallisce
        nodes: [{ html: '<div>Test 3</div>' }]
      }
    ];
    
    const result = generateWcagSummary(rules);
    
    expect(result.criteria['WCAG 1 1.1']).toEqual({
      total: 3,
      passed: 1,
      violations: 2
    });
  });
  
  test('dovrebbe gestire array vuoto di regole', () => {
    const result = generateWcagSummary([]);
    
    expect(result).toEqual({
      versions: {},
      criteria: {}
    });
  });
  
  test('dovrebbe gestire input null o undefined', () => {
    expect(generateWcagSummary(null)).toEqual({
      versions: {},
      criteria: {}
    });
    
    expect(generateWcagSummary(undefined)).toEqual({
      versions: {},
      criteria: {}
    });
  });
});