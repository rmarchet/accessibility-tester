import { JSDOM } from 'jsdom';
import axe from 'axe-core';
import { AccessibilityService } from '../accessibilityService';

jest.mock('axe-core');
describe('HTML with Contrast Issue', () => {
  let accessibilityService;

  beforeEach(() => {
    // Reset dei mock
    jest.clearAllMocks();
    
    // Inizializza il service
    accessibilityService = new AccessibilityService();

  });

  test('dovrebbe rilevare problemi di contrasto del colore', async () => {
    const htmlWithContrastIssue = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { background-color: #777; color: #999; }
          </style>
        </head>
        <body>
          <p>Questo testo ha un contrasto insufficiente con lo sfondo.</p>
        </body>
      </html>
    `;
    
    // Mock axe.run per simulare una violazione di contrasto del colore
    axe.run.mockResolvedValueOnce({
      passes: [],
      violations: [{
        id: 'color-contrast',
        impact: 'serious',
        description: 'Elements must have sufficient color contrast',
        help: 'Elements must have sufficient color contrast',
        helpUrl: 'https://dequeuniversity.com/rules/axe/4.4/color-contrast',
        tags: ['wcag2aa', 'wcag143'],
        nodes: [{
          html: '<p>Questo testo ha un contrasto insufficiente con lo sfondo.</p>',
          failureSummary: 'Fix any of the following: Element has insufficient color contrast of 1.13 (foreground color: #999, background color: #777, font size: 12.0pt, font weight: normal)',
          target: ['p']
        }]
      }]
    });
    
    const results = await accessibilityService.runTests(htmlWithContrastIssue);
    
    // Verifica che ci sia una violazione di contrasto
    expect(results.violations.some(v => v.id === 'color-contrast')).toBe(true);
    
    // Verifica che le informazioni WCAG siano corrette
    const contrastViolation = results.violations.find(v => v.id === 'color-contrast');
    expect(contrastViolation.wcag.some(w => w.criterion === '4.3')).toBe(true);
  });
})
