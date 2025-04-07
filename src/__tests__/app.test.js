import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import accessibilityRoutes from '../routes/accessibility';
import fetchUrlRoutes from '../routes/fetch-url';
import { server } from '../app';

// Mock delle dipendenze
jest.mock('express', () => {
  const mockApp = {
    use: jest.fn().mockReturnThis(),
    get: jest.fn().mockReturnThis(),
    listen: jest.fn().mockImplementation((port, callback) => {
      if (callback) callback();
      return mockApp;
    }),
  };
  
  const mockExpress = jest.fn().mockReturnValue(mockApp);
  mockExpress.json = jest.fn().mockReturnValue('json-middleware');
  mockExpress.static = jest.fn().mockReturnValue('static-middleware');
  
  return mockExpress;
});

jest.mock('cors', () => jest.fn().mockReturnValue('cors-middleware'));
jest.mock('dotenv', () => ({ config: jest.fn() }));
jest.mock('path', () => ({ 
  join: jest.fn().mockImplementation((...args) => args.join('/'))
}));
jest.mock('../routes/accessibility', () => 'accessibility-routes');
jest.mock('../routes/fetch-url', () => 'fetch-url-routes');

// Backup del process.env e console.log originali
const originalEnv = { ...process.env };
const originalLog = console.log;
const originalCwd = process.cwd;

describe('App Server Function', () => {
  let mockApp;
  
  beforeEach(() => {
    // Reset dei mock
    jest.clearAllMocks();
    
    // Mock di console.log
    console.log = jest.fn();
    
    // Mock di process.cwd
    process.cwd = jest.fn().mockReturnValue('/mocked/cwd');
    
    // Backup di process.env e impostazione di un ambiente pulito
    process.env = { ...originalEnv };
    
    // Ottieni l'app mockato da express
    mockApp = express();
  });
  
  afterEach(() => {
    // Ripristina process.env, console.log e process.cwd
    process.env = originalEnv;
    console.log = originalLog;
    process.cwd = originalCwd;
  });
  
  test('dovrebbe inizializzare express e configurare i middleware', () => {
    server();
    
    // Verifica che express sia stato chiamato
    expect(express).toHaveBeenCalled();
    
    // Verifica i middleware
    expect(cors).toHaveBeenCalled();
    expect(mockApp.use).toHaveBeenCalledWith('cors-middleware');
    
    expect(express.json).toHaveBeenCalledWith({ limit: '10mb' });
    expect(mockApp.use).toHaveBeenCalledWith('json-middleware');
    
    expect(path.join).toHaveBeenCalledWith('/mocked/cwd', 'public');
    expect(express.static).toHaveBeenCalled();
    expect(mockApp.use).toHaveBeenCalledWith('static-middleware');
  });
  
  test('dovrebbe configurare le route corrette', () => {
    server();
    
    // Verifica che le route siano state configurate
    expect(mockApp.use).toHaveBeenCalledWith('/api/accessibility', 'accessibility-routes');
    expect(mockApp.use).toHaveBeenCalledWith('/api/fetch-url', 'fetch-url-routes');
  });
  
  test('dovrebbe configurare l\'endpoint health check', () => {
    server();
    
    // Verifica che l'endpoint health sia stato configurato
    expect(mockApp.get).toHaveBeenCalledWith('/health', expect.any(Function));
    
    // Testa la funzione di callback dell'endpoint health
    const healthHandler = mockApp.get.mock.calls.find(call => call[0] === '/health')[1];
    const mockReq = {};
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    
    healthHandler(mockReq, mockRes);
    
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({ status: 'ok' });
  });
  
  test('dovrebbe configurare l\'endpoint frontend', () => {
    server();
    
    // Verifica che l'endpoint frontend sia stato configurato
    expect(mockApp.get).toHaveBeenCalledWith('/frontend', expect.any(Function));
    
    // Testa la funzione di callback dell'endpoint frontend
    const frontendHandler = mockApp.get.mock.calls.find(call => call[0] === '/frontend')[1];
    const mockReq = {};
    const mockRes = {
      sendFile: jest.fn()
    };
    
    frontendHandler(mockReq, mockRes);
    
    expect(path.join).toHaveBeenCalledWith('/mocked/cwd', './public/index.html');
    expect(mockRes.sendFile).toHaveBeenCalledWith('/mocked/cwd/./public/index.html');
  });
  
  test('dovrebbe configurare l\'endpoint root', () => {
    server();
    
    // Verifica che l'endpoint root sia stato configurato
    expect(mockApp.get).toHaveBeenCalledWith('/', expect.any(Function));
    
    // Testa la funzione di callback dell'endpoint root
    const rootHandler = mockApp.get.mock.calls.find(call => call[0] === '/')[1];
    const mockReq = {};
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    
    rootHandler(mockReq, mockRes);
    
    expect(mockRes.status).toHaveBeenCalledWith(405);
    expect(mockRes.json).toHaveBeenCalledWith({ error: 'METHOD NOT FOUND' });
  });
  
  test('dovrebbe avviare il server sulla porta configurata', () => {
    // Imposta PORT in process.env
    process.env.PORT = '5000';
    
    server();
    
    // Verifica che app.listen sia stato chiamato con la porta corretta
    expect(mockApp.listen).toHaveBeenCalledWith('5000', expect.any(Function));
    
    // Verifica che i log siano stati chiamati
    expect(console.log).toHaveBeenCalledWith('Server running on port: 5000');
    expect(console.log).toHaveBeenCalledWith('Frontend available at the URL: http://localhost:5000/frontend');
  });
  
  test('dovrebbe avviare il server sulla porta di default se non configurata', () => {
    // Assicurati che PORT non sia in process.env
    delete process.env.PORT;
    
    server();
    
    // Verifica che app.listen sia stato chiamato con la porta default
    expect(mockApp.listen).toHaveBeenCalledWith(3000, expect.any(Function));
    
    // Verifica che i log siano stati chiamati
    expect(console.log).toHaveBeenCalledWith('Server running on port: 3000');
    expect(console.log).toHaveBeenCalledWith('Frontend available at the URL: http://localhost:3000/frontend');
  });
});