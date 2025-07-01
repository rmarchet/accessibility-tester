import { Router } from 'express';
import { AccessibilityController } from '../../controllers/accessibilityController';
import { AccessibilityService } from '../../services/accessibilityService';

// Mock dei moduli
jest.mock('express', () => {
  const mockRouter = {
    post: jest.fn().mockReturnThis(),
  };
  return {
    Router: jest.fn().mockReturnValue(mockRouter)
  };
});

jest.mock('../../controllers/accessibilityController');
jest.mock('../../services/accessibilityService');

describe('Accessibility Router', () => {
  let accessibilityRouter;
  let mockController;
  
  beforeEach(() => {
    // Reset dei mocks
    jest.clearAllMocks();
    
    // Reimporta il router per inizializzare con i mock freschi
    jest.isolateModules(() => {
      accessibilityRouter = require('../../routes/accessibility').default;
    });
    
    // Ottieni riferimento all'istanza mockata del controller
    mockController = AccessibilityController.mock.instances[0];
  });
  
  test('dovrebbe inizializzare correttamente il router con i servizi necessari', () => {
    // Verifica che il service sia stato creato
    expect(AccessibilityService).toHaveBeenCalledTimes(1);
    
    // Verifica che il controller sia stato creato con il service
    expect(AccessibilityController).toHaveBeenCalledTimes(1);
    expect(AccessibilityController).toHaveBeenCalledWith(
      expect.any(AccessibilityService)
    );
    
    // Verifica che il router sia stato configurato
    const routerInstance = Router();
    expect(routerInstance.post).toHaveBeenCalledWith(
      '/test',
      expect.any(Function)
    );
  });
  
  test('dovrebbe collegare correttamente il controller al route handler', async () => {
    // Ottieni la funzione di callback passata a router.post
    const routerInstance = Router();
    const testHandler = routerInstance.post.mock.calls[0][1];
    
    // Simula req e res
    const req = { body: { html: '<html></html>' } };
    const res = { json: jest.fn() };
    
    // Mock dell'implementazione del controller
    mockController.testAccessibility = jest.fn().mockImplementation((req, res) => {
      res.json({ result: 'success' });
    });
    
    // Esegui l'handler
    await testHandler(req, res);
    
    // Verifica che il controller sia stato chiamato con i parametri corretti
    expect(mockController.testAccessibility).toHaveBeenCalledWith(req, res);
  });
});