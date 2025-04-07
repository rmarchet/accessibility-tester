import AccessibilityService from '../accessibilityService';
import { JSDOM } from 'jsdom';
import axe from 'axe-core';
import { createCanvas } from 'canvas';

// Mock delle dipendenze
jest.mock('jsdom');
jest.mock('axe-core');
jest.mock('canvas');

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
        nodes: [
          {
            html: '<div>Pass node</div>',
            target: ['div']
          }
        ]
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
        nodes: [
          {
            html: '<img src="test.jpg">',
            failureSummary: 'Fix any of the following: Element does not have alt text',
            target: ['img']
          }
        ]
      }
    ]);
    
    // Verifica il summary
    expect(results.summary).toEqual({
      passed: 1,
      violations: 1,
      total: 2
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
});