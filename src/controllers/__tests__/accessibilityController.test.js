import AccessibilityController from '../../controllers/accessibilityController';
import AccessibilityService from '../../services/accessibilityService';

describe('AccessibilityController', () => {
  let accessibilityController;
  let mockAccessibilityService;
  let req;
  let res;
  
  beforeEach(() => {
    // Mock del service
    mockAccessibilityService = {
      runTests: jest.fn()
    };
    
    // Inizializza il controller con il service mockato
    accessibilityController = new AccessibilityController(mockAccessibilityService);
    
    // Mock degli oggetti req e res
    req = {
      body: {
        html: '<html><body><h1>Test</h1></body></html>'
      }
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });
  
  test('dovrebbe chiamare il service e restituire i risultati del test di accessibilità', async () => {
    // Mock del risultato del service
    const mockResults = {
      violations: [{ id: 'test-violation', description: 'Test violation' }],
      passes: [{ id: 'test-pass', description: 'Test pass' }]
    };
    mockAccessibilityService.runTests.mockResolvedValue(mockResults);
    
    // Chiama il metodo del controller
    await accessibilityController.testAccessibility(req, res);
    
    // Verifica che il service sia stato chiamato con l'HTML corretto
    expect(mockAccessibilityService.runTests).toHaveBeenCalledWith(req.body.html);
    
    // Verifica che la risposta sia stata inviata correttamente
    expect(res.json).toHaveBeenCalledWith(mockResults);
  });
  
  test('dovrebbe gestire correttamente la mancanza di HTML nella richiesta', async () => {
    // Richiesta senza HTML
    req.body = {};
    
    // Chiama il metodo del controller
    await accessibilityController.testAccessibility(req, res);
    
    // Verifica che venga restituito un errore 400
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ 
      error: expect.any(String) 
    });
    
    // Verifica che il service non sia stato chiamato
    expect(mockAccessibilityService.runTests).not.toHaveBeenCalled();
  });
  
  test('dovrebbe gestire errori del service', async () => {
    // Mock di un errore dal service
    const mockError = new Error('Service error');
    mockAccessibilityService.runTests.mockRejectedValue(mockError);
    
    // Chiama il metodo del controller
    await accessibilityController.testAccessibility(req, res);
    
    // Verifica che venga restituito un errore 500
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ 
      error: 'An error occurred while testing accessibility',
    });
  });
});