// Mock di Express e Axios
jest.mock('express', () => {
  // Simuliamo Router di express
  const mockRouter = {
    post: jest.fn().mockReturnThis(),
  };
  return {
    Router: jest.fn().mockReturnValue(mockRouter)
  };
});

jest.mock('axios');

const express = require('express');
const axios = require('axios');
const fetchUrlRouter = require('../fetch-url')

describe('Fetch URL Router', () => {
  // Ottieni accesso alla funzione registrata con router.post
  const routerInstance = express.Router();
  const postCallback = routerInstance.post.mock.calls[0][1];
  
  // Mock degli oggetti req e res
  let req;
  let res;
  
  beforeEach(() => {
    req = {
      body: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });
  
  test('dovrebbe restituire errore 400 se l\'URL è mancante', async () => {
    await postCallback(req, res);
    
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'URL is required' });
  });
  
  test('dovrebbe aggiungere https:// quando manca il protocollo', async () => {
    req.body.url = 'example.com';
    
    // Mock della risposta di axios
    const mockHtml = '<html><body><h1>Test Page</h1></body></html>';
    axios.get.mockResolvedValueOnce({ data: mockHtml });
    
    await postCallback(req, res);
    
    expect(axios.get).toHaveBeenCalledWith('https://example.com', {
      headers: {
        'User-Agent': 'Mozilla/5.0 Accessibility Checker Bot'
      }
    });
    expect(res.json).toHaveBeenCalledWith({ html: mockHtml });
  });
  
  test('dovrebbe mantenere il protocollo se già presente', async () => {
    req.body.url = 'http://example.com';
    
    // Mock della risposta di axios
    const mockHtml = '<html><body><h1>Test Page</h1></body></html>';
    axios.get.mockResolvedValueOnce({ data: mockHtml });
    
    await postCallback(req, res);
    
    expect(axios.get).toHaveBeenCalledWith('http://example.com', {
      headers: {
        'User-Agent': 'Mozilla/5.0 Accessibility Checker Bot'
      }
    });
    expect(res.json).toHaveBeenCalledWith({ html: mockHtml });
  });
  
  test('dovrebbe gestire errori nella richiesta HTTP', async () => {
    req.body.url = 'example.com';
    
    // Mock di un errore di axios
    const mockError = new Error('Network Error');
    axios.get.mockRejectedValueOnce(mockError);
    
    await postCallback(req, res);
    
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Failed to fetch URL',
      message: mockError.message
    });
  });
});