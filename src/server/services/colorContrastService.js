import { NAMED_COLORS } from "./namedColors.js"
import { 
  DEFAULT_BROWSER_COLORS,
  DEFAULT_TEXT_COLOR,
  DEFAULT_BACKGROUND_COLOR,
  DEFAULT_FONT_SIZE,
} from "./browserDefaults.js"
import { SYSTEM_COLORS } from "./systemColors.js"

export class ColorContrastService {
  static DEFAULT_TEXT_COLOR = DEFAULT_TEXT_COLOR
  static DEFAULT_BACKGROUND_COLOR = DEFAULT_BACKGROUND_COLOR
  static DEFAULT_FONT_SIZE = DEFAULT_FONT_SIZE
  static BROWSER_DEFAULT_STYLES = DEFAULT_BROWSER_COLORS
  runCustomContrastTests(window, document) {
    const contrastResults = {
      passes: [],
      violations: []
    }

    const textElements = document.querySelectorAll('p, div, h1, h2, h3, h4, h5, h6, a, span, label, button, input, select, textarea, li, td, th');
    
    textElements.forEach(element => {
      if (this.isElementHidden(element, window) || !element.textContent.trim()) {
        return;
      }

      const computedStyle = window.getComputedStyle(element)
      const tagName = element.tagName.toLowerCase()

      let foregroundColor;
      if (computedStyle.color) {
        foregroundColor = this.parseColor(computedStyle.color);
      } else if (ColorContrastService.BROWSER_DEFAULT_STYLES[tagName]?.color) {
        foregroundColor = ColorContrastService.BROWSER_DEFAULT_STYLES[tagName].color;
        
        if (tagName === 'a') {
          if (element.classList.contains('visited') || computedStyle.getPropertyValue(':visited')) {
            foregroundColor = ColorContrastService.BROWSER_DEFAULT_STYLES.a.visitedColor;
          } else if (element.classList.contains('active') || computedStyle.getPropertyValue(':active')) {
            foregroundColor = ColorContrastService.BROWSER_DEFAULT_STYLES.a.activeColor;
          }
        }
      } else {
        foregroundColor = ColorContrastService.DEFAULT_TEXT_COLOR;
      }

      let backgroundColor;

      if (computedStyle.backgroundColor && computedStyle.backgroundColor !== 'rgba(0, 0, 0, 0)' && computedStyle.backgroundColor !== 'transparent') {
        backgroundColor = this.parseColor(computedStyle.backgroundColor);
      } else {

        if (ColorContrastService.BROWSER_DEFAULT_STYLES[tagName]?.backgroundColor) {
          backgroundColor = ColorContrastService.BROWSER_DEFAULT_STYLES[tagName].backgroundColor;
        } else {
          backgroundColor = this.findEffectiveBackgroundColor(element, window);
        }
      }
      
      const contrastRatio = this.calculateContrastRatio(foregroundColor, backgroundColor);
      
      let fontSize, isBold;
      
      if (computedStyle.fontSize) {
        fontSize = parseFloat(computedStyle.fontSize);
      } else if (tagName.match(/^h[1-6]$/)) {
        const headingSize = {
          h1: 32, h2: 24, h3: 18.72, h4: 16, h5: 13.28, h6: 12
        };
        fontSize = headingSize[tagName] || ColorContrastService.DEFAULT_FONT_SIZE;
      } else {
        fontSize = ColorContrastService.DEFAULT_FONT_SIZE;
      }
      
      if (computedStyle.fontWeight) {
        isBold = parseInt(computedStyle.fontWeight, 10) >= 700;
      } else if (tagName === 'b' || tagName === 'strong' || tagName === 'th' || 
                 ColorContrastService.BROWSER_DEFAULT_STYLES[tagName]?.fontWeight === 'bold') {
        isBold = true;
      } else {
        isBold = false;
      }
      
      let requiredRatioAA, requiredRatioAAA;
      
      if ((fontSize >= 18) || (fontSize >= 14 && isBold)) {
        requiredRatioAA = 3.0;
        requiredRatioAAA = 4.5;
      } else {
        requiredRatioAA = 4.5;
        requiredRatioAAA = 7.0;
      }
      
      if (contrastRatio < requiredRatioAA) {
        contrastResults.violations.push({
          id: 'custom-color-contrast',
          impact: 'serious',
          description: 'Elements must have sufficient color contrast',
          help: 'Text elements must have a contrast ratio of at least 4.5:1 (3:1 for large text)',
          helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html',
          tags: ['wcag2aa', 'wcag143'],
          nodes: [{
            html: element.outerHTML,
            failureSummary: `Fix any of the following: Element has insufficient color contrast of ${contrastRatio.toFixed(2)}:1 (foreground: ${this.colorToHex(foregroundColor)}, background: ${this.colorToHex(backgroundColor)}, font size: ${fontSize}pt, font weight: ${isBold ? 'bold' : 'normal'})`,
            target: [this.getElementSelector(element)]
          }]
        });
      } else if (contrastRatio < requiredRatioAAA) {
        // Pass AA but not AAA
        contrastResults.passes.push({
          id: 'custom-color-contrast-aa',
          description: 'Elements have sufficient color contrast for WCAG AA',
          help: 'Text elements have a contrast ratio of at least 4.5:1 (3:1 for large text)',
          helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html',
          tags: ['wcag2aa', 'wcag143'],
          nodes: [{
            html: element.outerHTML,
            target: [this.getElementSelector(element)]
          }]
        });
        
        // Violation AAA
        contrastResults.violations.push({
          id: 'custom-color-contrast-aaa',
          impact: 'moderate',
          description: 'Elements must have enhanced color contrast',
          help: 'Text elements should have a contrast ratio of at least 7:1 (4.5:1 for large text)',
          helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/contrast-enhanced.html',
          tags: ['wcag2aaa', 'wcag146'],
          nodes: [{
            html: element.outerHTML,
            failureSummary: `Element has insufficient color contrast for AAA of ${contrastRatio.toFixed(2)}:1 (foreground: ${this.colorToHex(foregroundColor)}, background: ${this.colorToHex(backgroundColor)}, font size: ${fontSize}pt, font weight: ${isBold ? 'bold' : 'normal'})`,
            target: [this.getElementSelector(element)]
          }]
        });
      } else {
        // Pass both AA and AAA
        contrastResults.passes.push({
          id: 'custom-color-contrast',
          description: 'Elements have sufficient color contrast',
          help: 'Text elements have a contrast ratio of at least 7:1 (4.5:1 for large text)',
          helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/contrast-enhanced.html',
          tags: ['wcag2aa', 'wcag2aaa', 'wcag143', 'wcag146'],
          nodes: [{
            html: element.outerHTML,
            target: [this.getElementSelector(element)]
          }]
        });
      }
    });
    
    return contrastResults;
  }

  isElementHidden(element, window) {
    const style = window.getComputedStyle(element);
    return style.display === 'none' || 
           style.visibility === 'hidden' || 
           style.opacity === '0' ||
           element.getAttribute('aria-hidden') === 'true';
  }

  parseColor(colorStr) {
    if (!colorStr) {
      return ColorContrastService.DEFAULT_TEXT_COLOR;
    }

    if (colorStr.startsWith('rgb')) {
      // Estrai i numeri utilizzando un regex più specifico per ogni formato
      const rgbaMatch = colorStr.match(/rgba?\(\s*(\d+|[\d.]+%)\s*,\s*(\d+|[\d.]+%)\s*,\s*(\d+|[\d.]+%)\s*(?:,\s*([\d.]+))?\s*\)/i);
      
      if (!rgbaMatch) {
        return ColorContrastService.DEFAULT_TEXT_COLOR;
      }
      
      // Converti percentuali in numeri se necessario
      let r = rgbaMatch[1].endsWith('%') ? Math.round(parseFloat(rgbaMatch[1]) * 2.55) : parseInt(rgbaMatch[1], 10);
      let g = rgbaMatch[2].endsWith('%') ? Math.round(parseFloat(rgbaMatch[2]) * 2.55) : parseInt(rgbaMatch[2], 10);
      let b = rgbaMatch[3].endsWith('%') ? Math.round(parseFloat(rgbaMatch[3]) * 2.55) : parseInt(rgbaMatch[3], 10);
      let a = rgbaMatch[4] ? parseFloat(rgbaMatch[4]) : 1;
      
      return { r, g, b, a };
    } else if (colorStr.startsWith('#')) {
      // Converte HEX in RGB
      let hex = colorStr.substring(1);
      
      // Gestisce formati HEX non validi
      if (![3, 4, 6, 8].includes(hex.length)) {
        return ColorContrastService.DEFAULT_TEXT_COLOR;
      }
      
      // Espandi formati accorciati come #FFF a #FFFFFF
      if (hex.length === 3 || hex.length === 4) {
        hex = hex.split('').map(x => x + x).join('');
      }
      
      try {
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        const a = hex.length === 8 ? parseInt(hex.substring(6, 8), 16) / 255 : 1;
        
        // Verifica che i valori siano numeri validi
        if (isNaN(r) || isNaN(g) || isNaN(b) || isNaN(a)) {
          return ColorContrastService.DEFAULT_TEXT_COLOR;
        }
        
        return { r, g, b, a };
      } catch (e) {
        return ColorContrastService.DEFAULT_TEXT_COLOR;
      }
    } else if (colorStr === 'transparent') {
      return { r: 0, g: 0, b: 0, a: 0 };
    } else if (colorStr === 'currentcolor') {
      return ColorContrastService.DEFAULT_TEXT_COLOR;
    }

    const systemColors = SYSTEM_COLORS;
  
    if (systemColors[colorStr]) {
      console.log(`System color found: ${colorStr}, use approssimative color`);
      return systemColors[colorStr];
    }

    const normalizedColorName = colorStr.toLowerCase().trim();
    if (NAMED_COLORS[normalizedColorName]) {
      return NAMED_COLORS[normalizedColorName];
    }
    
    console.warn(`Color not recognised: ${colorStr}, use default color`);
    return ColorContrastService.DEFAULT_TEXT_COLOR;
  }

  findEffectiveBackgroundColor(element, window) {
    let current = element;
    // Inizializza con uno sfondo trasparente
    let bg = { r: 0, g: 0, b: 0, a: 0 };
    
    // Raccogliamo gli sfondi in ordine dal più vicino al più lontano
    const backgrounds = [];
    
    while (current) {
      const style = window.getComputedStyle(current);
      
      if (style.backgroundColor && 
          style.backgroundColor !== 'rgba(0, 0, 0, 0)' && 
          style.backgroundColor !== 'transparent') {
        
        // Per i colori di sistema come "ButtonFace"
        let currentBg;
        if (style.backgroundColor.startsWith('rgba') || 
            style.backgroundColor.startsWith('rgb') || 
            style.backgroundColor.startsWith('#')) {
          currentBg = this.parseColor(style.backgroundColor);
        } else {
          // Colori di sistema o named colors
          currentBg = this.parseColor(style.backgroundColor);
        }
        
        // Aggiungi lo sfondo alla lista
        backgrounds.push(currentBg);
        
        // Se troviamo uno sfondo completamente opaco, possiamo fermarci
        if (currentBg.a >= 0.99) {
          break;
        }
      }
      
      current = current.parentElement;
    }
    
    // Se non abbiamo trovato alcuno sfondo, usiamo il bianco come default
    if (backgrounds.length === 0) {
      return ColorContrastService.DEFAULT_BACKGROUND_COLOR;
    }
    
    // Aggiungiamo lo sfondo di default alla fine se necessario
    if (backgrounds[backgrounds.length - 1].a < 0.99) {
      backgrounds.push(ColorContrastService.DEFAULT_BACKGROUND_COLOR);
    }
    
    // Ora applichiamo l'alpha compositing, partendo dal più lontano (sfondo)
    // e andando verso il più vicino (foreground)
    let result = backgrounds[backgrounds.length - 1];
    
    for (let i = backgrounds.length - 2; i >= 0; i--) {
      const fg = backgrounds[i];
      const bg = result;
      
      // Alpha compositing standard: result = fg + bg * (1 - fg.a)
      const resultAlpha = fg.a + bg.a * (1 - fg.a);
      
      if (resultAlpha < 0.01) {
        // Evita divisioni per quasi-zero
        result = { r: 0, g: 0, b: 0, a: 0 };
      } else {
        result = {
          r: Math.round((fg.r * fg.a + bg.r * bg.a * (1 - fg.a)) / resultAlpha),
          g: Math.round((fg.g * fg.a + bg.g * bg.a * (1 - fg.a)) / resultAlpha),
          b: Math.round((fg.b * fg.a + bg.b * bg.a * (1 - fg.a)) / resultAlpha),
          a: resultAlpha
        };
      }
    }
    
    // Assicuriamoci che il risultato finale abbia alpha = 1
    if (result.a < 0.99) {
      const bgWhite = ColorContrastService.DEFAULT_BACKGROUND_COLOR;
      const alpha = result.a;
      
      result = {
        r: Math.round(result.r * alpha + bgWhite.r * (1 - alpha)),
        g: Math.round(result.g * alpha + bgWhite.g * (1 - alpha)),
        b: Math.round(result.b * alpha + bgWhite.b * (1 - alpha)),
        a: 1
      };
    }
    
    return result;
  }

  calculateContrastRatio(fore, back) {
    const l1 = this.calculateRelativeLuminance(fore);
    const l2 = this.calculateRelativeLuminance(back);
    
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    
    return (lighter + 0.05) / (darker + 0.05);
  }

  calculateRelativeLuminance(color) {
    if (color.a === 0) {
      return this.calculateRelativeLuminance(ColorContrastService.DEFAULT_BACKGROUND_COLOR);
    }
    
    // Applica l'alfa blending con bianco per colori semi-trasparenti
    const r = color.a * color.r + (1 - color.a) * 255;
    const g = color.a * color.g + (1 - color.a) * 255;
    const b = color.a * color.b + (1 - color.a) * 255;
    
    // Normalizza RGB a valori tra 0 e 1
    const normR = r / 255;
    const normG = g / 255;
    const normB = b / 255;
    
    // Applica la correzione gamma
    const gammaCorrectedR = normR <= 0.03928 ? normR / 12.92 : Math.pow((normR + 0.055) / 1.055, 2.4);
    const gammaCorrectedG = normG <= 0.03928 ? normG / 12.92 : Math.pow((normG + 0.055) / 1.055, 2.4);
    const gammaCorrectedB = normB <= 0.03928 ? normB / 12.92 : Math.pow((normB + 0.055) / 1.055, 2.4);
    
    // Calcola la luminanza usando la formula WCAG
    return 0.2126 * gammaCorrectedR + 0.7152 * gammaCorrectedG + 0.0722 * gammaCorrectedB;
  }
  
  colorToHex(color) {
    const r = Math.round(color.r);
    const g = Math.round(color.g);
    const b = Math.round(color.b);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  getElementSelector(element) {
    // Crea un selettore CSS semplificato per l'elemento
    let selector = element.tagName.toLowerCase();
    
    if (element.id) {
      selector += `#${element.id}`;
    } else if (element.className) {
      const classNames = element.className.split(' ').filter(Boolean);
      if (classNames.length > 0) {
        selector += `.${classNames[0]}`;
      }
    }
    
    return selector;
  }
}

// Esporta un'istanza singleton del servizio
export default new ColorContrastService();
