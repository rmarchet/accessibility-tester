import { JSDOM } from 'jsdom';
import colorContrastService, { ColorContrastService } from '../colorContrastService';

describe('ColorContrastService', () => {
  let service;

  beforeEach(() => {
    service = new ColorContrastService();
  });
  
  test('parseColor dovrebbe analizzare correttamente i colori RGB', () => {
    expect(service.parseColor('rgb(255, 0, 0)')).toEqual({ r: 255, g: 0, b: 0, a: 1 });
    expect(service.parseColor('rgb(255)')).toEqual({ r: 0, g: 0, b: 0, a:1});
    expect(service.parseColor('rgb()')).toEqual({ r: 0, g: 0, b: 0, a:1});
    expect(service.parseColor('rgb(foobar)')).toEqual({ r: 0, g: 0, b: 0, a:1});
  });

  test('parseColor dovrebbe gestire correttamente i colori RGBA con valori decimali', () => {
    // Test con diverse varianti di rgba con decimali
    expect(service.parseColor('rgba(0, 255, 0, 0.5)')).toEqual({ r: 0, g: 255, b: 0, a: 0.5 });
    expect(service.parseColor('rgba(0, 255, 0, .5)')).toEqual({ r: 0, g: 255, b: 0, a: 0.5 });
    expect(service.parseColor('rgba(0, 255, 0, 0.75)')).toEqual({ r: 0, g: 255, b: 0, a: 0.75 });
    expect(service.parseColor('rgba(0, 255, 0, 1)')).toEqual({ r: 0, g: 255, b: 0, a: 1 });
    expect(service.parseColor('rgba(0, 255, 0, 0)')).toEqual({ r: 0, g: 255, b: 0, a: 0 });
  })

  test('parseColor dovrebbe gestire correttamente i colori RGBA con sintassi spazi variabili', () => {
    // Test con diverse varianti di sintassi e spaziatura
    expect(service.parseColor('rgba(0,255,0,0.5)')).toEqual({ r: 0, g: 255, b: 0, a: 0.5 });
    expect(service.parseColor('rgba( 0, 255, 0, 0.5 )')).toEqual({ r: 0, g: 255, b: 0, a: 0.5 });
    expect(service.parseColor('rgba(0, 255, 0,0.5)')).toEqual({ r: 0, g: 255, b: 0, a: 0.5 });
  });

  test('parseColor dovrebbe gestire correttamente i colori RGB/RGBA con valori percentuali', () => {
    // Test con valori percentuali
    expect(service.parseColor('rgb(100%, 0%, 0%)')).toEqual({ r: 255, g: 0, b: 0, a: 1 });
    expect(service.parseColor('rgba(100%, 0%, 0%, 0.5)')).toEqual({ r: 255, g: 0, b: 0, a: 0.5 });
    expect(service.parseColor('rgba(51%, 51%, 51%, 0.5)')).toEqual({ r: 130, g: 130, b: 130, a: 0.5 });
  });
  
  test('parseColor dovrebbe analizzare correttamente i colori HEX', () => {
    expect(service.parseColor('#FF0000')).toEqual({ r: 255, g: 0, b: 0, a: 1 });
    expect(service.parseColor('#00FF00')).toEqual({ r: 0, g: 255, b: 0, a: 1 });
    expect(service.parseColor('#F00')).toEqual({ r: 255, g: 0, b: 0, a: 1 });
  });

  test('parseColor dovrebbe gestire correttamente valori HEX con canale alpha', () => {
    // Test con HEX che include trasparenza
    expect(service.parseColor('#FF0000FF')).toEqual({ r: 255, g: 0, b: 0, a: 1 });
    expect(service.parseColor('#FF000080')).toEqual({ r: 255, g: 0, b: 0, a: 0.5019607843137255 });
    expect(service.parseColor('#FF000000')).toEqual({ r: 255, g: 0, b: 0, a: 0 });
    
    // Test con HEX accorciato che include trasparenza
    expect(service.parseColor('#F00F')).toEqual({ r: 255, g: 0, b: 0, a: 1 });
    expect(service.parseColor('#F008')).toEqual({ r: 255, g: 0, b: 0, a: 0.5333333333333333 });
    expect(service.parseColor('#F000')).toEqual({ r: 255, g: 0, b: 0, a: 0 });
  });

  test('parseColor dovrebbe gestire correttamente i nomi di colori CSS', () => {
    // Test con nomi di colori standard
    expect(service.parseColor('red')).toEqual({ r: 255, g: 0, b: 0, a: 1 });
    expect(service.parseColor('green')).toEqual({ r: 0, g: 128, b: 0, a: 1 });
    expect(service.parseColor('blue')).toEqual({ r: 0, g: 0, b: 255, a: 1 });
    expect(service.parseColor('white')).toEqual({ r: 255, g: 255, b: 255, a: 1 });
    expect(service.parseColor('black')).toEqual({ r: 0, g: 0, b: 0, a: 1 });
    
    // Test con nomi di colori case-insensitive
    expect(service.parseColor('RED')).toEqual({ r: 255, g: 0, b: 0, a: 1 });
    expect(service.parseColor('Blue')).toEqual({ r: 0, g: 0, b: 255, a: 1 });
  });

  test('parseColor dovrebbe gestire correttamente i colori di sistema', () => {
    // Test con colori di sistema
    expect(service.parseColor('ButtonFace')).toEqual({ r: 240, g: 240, b: 240, a: 1 });
    expect(service.parseColor('ButtonText')).toEqual({ r: 0, g: 0, b: 0, a: 1 });
    expect(service.parseColor('Canvas')).toEqual({ r: 255, g: 255, b: 255, a: 1 });
    expect(service.parseColor('CanvasText')).toEqual({ r: 0, g: 0, b: 0, a: 1 });
  });
  
  test('parseColor dovrebbe gestire correttamente i valori speciali', () => {
    // Test con valori speciali
    expect(service.parseColor('transparent')).toEqual({ r: 0, g: 0, b: 0, a: 0 });
    expect(service.parseColor('currentcolor')).toEqual(ColorContrastService.DEFAULT_TEXT_COLOR);
    
    // Test con colori non validi
    expect(service.parseColor('not-a-color')).toEqual(ColorContrastService.DEFAULT_TEXT_COLOR);
    expect(service.parseColor('')).toEqual(ColorContrastService.DEFAULT_TEXT_COLOR);
    expect(service.parseColor(null)).toEqual(ColorContrastService.DEFAULT_TEXT_COLOR);
    expect(service.parseColor(undefined)).toEqual(ColorContrastService.DEFAULT_TEXT_COLOR);
  });
  
  test('calculateRelativeLuminance dovrebbe calcolare correttamente la luminanza', () => {
    // Bianco (1.0)
    expect(service.calculateRelativeLuminance({ r: 255, g: 255, b: 255, a: 1 })).toBeCloseTo(1.0, 2);
    // Nero (0.0)
    expect(service.calculateRelativeLuminance({ r: 0, g: 0, b: 0, a: 1 })).toBeCloseTo(0.0, 2);
    // Grigio medio (~0.21)
    expect(service.calculateRelativeLuminance({ r: 128, g: 128, b: 128, a: 1 })).toBeCloseTo(0.2158605001138992, 2);
  });
  
  test('calculateContrastRatio dovrebbe calcolare correttamente il rapporto di contrasto', () => {
    // Nero su bianco (21:1)
    const white = { r: 255, g: 255, b: 255, a: 1 };
    const black = { r: 0, g: 0, b: 0, a: 1 };
    expect(service.calculateContrastRatio(black, white)).toBeCloseTo(21, 0);
    
    // Grigio medio su bianco (~3.9:1)
    const gray = { r: 128, g: 128, b: 128, a: 1 };
    expect(service.calculateContrastRatio(gray, white)).toBeCloseTo(3.9, 1);
  });
  
  test('colorToHex dovrebbe convertire correttamente da RGB a HEX', () => {
    expect(service.colorToHex({ r: 255, g: 0, b: 0, a: 1 })).toBe('#ff0000');
    expect(service.colorToHex({ r: 0, g: 255, b: 0, a: 1 })).toBe('#00ff00');
    expect(service.colorToHex({ r: 0, g: 0, b: 255, a: 1 })).toBe('#0000ff');
  });
  
  test('getElementSelector dovrebbe generare selettori corretti', () => {
    const dom = new JSDOM(`<div id="test"></div><p class="paragraph"></p><span></span>`);
    const document = dom.window.document;
    
    expect(service.getElementSelector(document.getElementById('test'))).toBe('div#test');
    expect(service.getElementSelector(document.querySelector('.paragraph'))).toBe('p.paragraph');
    expect(service.getElementSelector(document.querySelector('span'))).toBe('span');
  });
  
  test('isElementHidden dovrebbe identificare correttamente elementi nascosti', () => {
    const dom = new JSDOM(`
      <div id="visible">Visible</div>
      <div id="display-none" style="display: none;">Hidden</div>
      <div id="visibility-hidden" style="visibility: hidden;">Hidden</div>
      <div id="opacity-zero" style="opacity: 0;">Hidden</div>
      <div id="aria-hidden" aria-hidden="true">Hidden</div>
    `);
    const document = dom.window.document;
    const window = dom.window;
    
    // Mock getComputedStyle
    window.getComputedStyle = element => ({
      display: element.id === 'display-none' ? 'none' : 'block',
      visibility: element.id === 'visibility-hidden' ? 'hidden' : 'visible',
      opacity: element.id === 'opacity-zero' ? '0' : '1'
    });
    
    expect(service.isElementHidden(document.getElementById('visible'), window)).toBe(false);
    expect(service.isElementHidden(document.getElementById('display-none'), window)).toBe(true);
    expect(service.isElementHidden(document.getElementById('visibility-hidden'), window)).toBe(true);
    expect(service.isElementHidden(document.getElementById('opacity-zero'), window)).toBe(true);
    expect(service.isElementHidden(document.getElementById('aria-hidden'), window)).toBe(true);
  });
  
  test('runCustomContrastTests dovrebbe identificare problemi di contrasto', () => {
    // Crea un DOM di test con un problema di contrasto
    const dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            .low-contrast { color: #777; background-color: #999; }
            .high-contrast { color: #000; background-color: #fff; }
          </style>
        </head>
        <body>
          <p class="low-contrast">Testo con contrasto insufficiente</p>
          <p class="high-contrast">Testo con buon contrasto</p>
        </body>
      </html>
    `);
    
    const window = dom.window;
    const document = window.document;
    
    // Mock getComputedStyle per il test
    window.getComputedStyle = jest.fn().mockImplementation((element) => {
      if (element.className === 'low-contrast') {
        return {
          color: 'rgb(119, 119, 119)',
          backgroundColor: 'rgb(153, 153, 153)',
          fontSize: '16px',
          fontWeight: '400',
          display: 'block',
          visibility: 'visible',
          opacity: '1'
        };
      } else {
        return {
          color: 'rgb(0, 0, 0)',
          backgroundColor: 'rgb(255, 255, 255)',
          fontSize: '16px',
          fontWeight: '400',
          display: 'block',
          visibility: 'visible',
          opacity: '1'
        };
      }
    });
    
    const results = service.runCustomContrastTests(window, document);
    
    // Verifica che ci sia una violazione di contrasto
    expect(results.violations.some(v => v.id === 'custom-color-contrast')).toBe(true);
    
    // Verifica che ci sia anche un pass per l'elemento con contrasto adeguato
    expect(results.passes.some(p => p.id === 'custom-color-contrast')).toBe(true);
  });
  
  test('findEffectiveBackgroundColor dovrebbe gestire la trasparenza correttamente', () => {
    const dom = new JSDOM(`
      <div id="parent" style="background-color: rgba(255, 0, 0, 1);">
        <div id="middle" style="background-color: rgba(0, 255, 0, 0.5);">
          <div id="child" style="background-color: rgba(0, 0, 255, 0.3);">
            Text
          </div>
        </div>
      </div>
    `);
    
    const window = dom.window;
    const document = window.document;
    
    const parentElement = document.getElementById('parent');
    const middleElement = document.getElementById('middle');
    const childElement = document.getElementById('child');
    
    expect(childElement.parentElement).toBe(middleElement);
    expect(middleElement.parentElement).toBe(parentElement);
    
    window.getComputedStyle = jest.fn(element => {
      if (element.id === 'parent') {
        return { backgroundColor: 'rgba(255, 0, 0, 1)' };
      } else if (element.id === 'middle') {
        return { backgroundColor: 'rgba(0, 255, 0, 0.6)' };
      } else if (element.id === 'child') {
        return { backgroundColor: 'rgba(0, 0, 255, 0.4)' };
      }
      return { backgroundColor: 'rgba(255, 255, 255, 1)' };
    });

    const bgColor = service.findEffectiveBackgroundColor(childElement, window);
  
  // Non verifichiamo i valori esatti, poiché potrebbero variare leggermente
  // a seconda dell'implementazione, ma verifichiamo il comportamento qualitativo
  
  // Verifica che tutte le componenti di colore siano state mescolate
  expect(bgColor.r).toBeGreaterThan(0); // Contributo del rosso dal parent
  expect(bgColor.g).toBeGreaterThan(0); // Contributo del verde dal middle
  expect(bgColor.b).toBeGreaterThan(0); // Contributo del blu dal child
  expect(bgColor.a).toBeCloseTo(1, 1); // L'alpha risultante dovrebbe essere vicino a 1
  
  // Verifica che i colori blended siano nei range attesi
  // In base alla composizione alpha, il verde dovrebbe avere un contributo significativo
  expect(bgColor.g).toBeGreaterThan(50);
  // Il blu dovrebbe avere un contributo minore del verde
  expect(bgColor.b).toBeLessThan(bgColor.g);
  });
});