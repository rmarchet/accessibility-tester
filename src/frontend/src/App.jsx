import { useState } from 'react'
import axios from 'axios'
import './App.css'

function App() {
  const [activeInputTab, setActiveInputTab] = useState('text')
  const [activeResultTab, setActiveResultTab] = useState('violations')
  const [htmlInput, setHtmlInput] = useState('')
  const [urlInput, setUrlInput] = useState('')
  const [fileInput, setFileInput] = useState(null)
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleTest = async () => {
    setLoading(true)
    setError(null)
    setResults(null)

    try {
      let response
      
      if (activeInputTab === 'text' && htmlInput.trim()) {
        response = await axios.post('/api/test', { html: htmlInput })
      } else if (activeInputTab === 'url' && urlInput.trim()) {
        response = await axios.post('/api/test', { url: urlInput })
      } else if (activeInputTab === 'file' && fileInput) {
        response = await axios.post('/api/test', { html: fileInput })
      } else {
        setError('Please provide input to test')
        setLoading(false)
        return
      }

      setResults(response.data)
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleClear = () => {
    setHtmlInput('')
    setUrlInput('')
    setFileInput(null)
    setResults(null)
    setError(null)
    if (document.getElementById('file-input')) {
      document.getElementById('file-input').value = ''
    }
  }

  const handleLoadSample = () => {
    const sampleHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sample Page</title>
</head>
<body>
    <h1>Sample Page for Testing</h1>
    <img src="example.jpg" alt="">
    <button>Click me</button>
    <input type="text" placeholder="Enter your name">
</body>
</html>`
    setHtmlInput(sampleHtml)
    setActiveInputTab('text')
  }

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (file && file.type === 'text/html') {
      const reader = new FileReader()
      reader.onload = (event) => {
        setFileInput(event.target.result)
      }
      reader.readAsText(file)
    }
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>Accessibility Checker</h1>
        <p>Test your website for accessibility issues using axe-core</p>
      </header>

      <main className="container">
        <div className="input-section">
          {/* Input Tabs */}
          <div className="input-tabs">
            <button 
              className={`input-tab-btn ${activeInputTab === 'text' ? 'active' : ''}`}
              onClick={() => setActiveInputTab('text')}
            >
              Input HTML
            </button>
            <button 
              className={`input-tab-btn ${activeInputTab === 'file' ? 'active' : ''}`}
              onClick={() => setActiveInputTab('file')}
            >
              Upload File
            </button>
            <button 
              className={`input-tab-btn ${activeInputTab === 'url' ? 'active' : ''}`}
              onClick={() => setActiveInputTab('url')}
            >
              Test URL
            </button>
          </div>

          {/* Input Content */}
          <div className="input-content-wrapper">
            {activeInputTab === 'text' && (
              <div className="input-content active">
                <label htmlFor="html-input">HTML to test:</label>
                <textarea
                  id="html-input"
                  rows="20"
                  placeholder="<html>...</html>"
                  value={htmlInput}
                  onChange={(e) => setHtmlInput(e.target.value)}
                />
              </div>
            )}

            {activeInputTab === 'file' && (
              <div className="input-content active">
                <label htmlFor="file-input">Upload HTML file:</label>
                <input
                  type="file"
                  id="file-input"
                  accept=".html,.htm"
                  onChange={handleFileUpload}
                />
                {fileInput && (
                  <div className="file-preview">
                    <p>File loaded successfully ({fileInput.length} characters)</p>
                  </div>
                )}
              </div>
            )}

            {activeInputTab === 'url' && (
              <div className="input-content active">
                <label htmlFor="url-input">Enter webpage URL:</label>
                <input
                  type="url"
                  id="url-input"
                  placeholder="https://example.com"
                  className="url-field"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                />
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="buttons">
            <button id="test-btn" onClick={handleTest} disabled={loading}>
              {loading ? 'Testing...' : 'Run test'}
            </button>
            <button id="clear-btn" onClick={handleClear}>
              Clear
            </button>
            <button id="sample-btn" onClick={handleLoadSample}>
              Load example
            </button>
          </div>

          {error && (
            <div className="error">
              <h3>Error</h3>
              <p>{error}</p>
            </div>
          )}
        </div>

        {/* Results Section */}
        <div className="results-section">
          <h2>Results</h2>
          
          {/* Summary Box */}
          <div className="summary-box">
            <div className="summary-content">
              {results ? (
                <>
                  <p><strong>Violations:</strong> {results.violations?.length || 0}</p>
                  <p><strong>Passes:</strong> {results.passes?.length || 0}</p>
                  <p><strong>Incomplete:</strong> {results.incomplete?.length || 0}</p>
                </>
              ) : (
                <p>No tests run yet</p>
              )}
            </div>
          </div>

          {/* Result Tabs */}
          {results && (
            <>
              <div className="tabs">
                <button 
                  className={`tab-btn ${activeResultTab === 'violations' ? 'active' : ''}`}
                  onClick={() => setActiveResultTab('violations')}
                >
                  Violations ({results.violations?.length || 0})
                </button>
                <button 
                  className={`tab-btn ${activeResultTab === 'passes' ? 'active' : ''}`}
                  onClick={() => setActiveResultTab('passes')}
                >
                  Passes ({results.passes?.length || 0})
                </button>
              </div>

              {/* Violations Tab */}
              {activeResultTab === 'violations' && (
                <div className="tab-content active">
                  {results.violations && results.violations.length > 0 ? (
                    results.violations.map((violation, index) => (
                      <div key={index} className="violation">
                        <h5>{violation.id}</h5>
                        <p><strong>Impact:</strong> {violation.impact}</p>
                        <p>{violation.description}</p>
                        <p><strong>Help:</strong> {violation.help}</p>
                        <a href={violation.helpUrl} target="_blank" rel="noopener noreferrer">
                          Learn more
                        </a>
                        {violation.nodes && violation.nodes.length > 0 && (
                          <div className="violation-nodes">
                            <strong>Elements:</strong>
                            {violation.nodes.map((node, nodeIndex) => (
                              <div key={nodeIndex} className="violation-node">
                                <code>{node.target?.join(', ')}</code>
                                {node.html && <pre>{node.html}</pre>}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="placeholder">No violations found!</p>
                  )}
                </div>
              )}

              {/* Passes Tab */}
              {activeResultTab === 'passes' && (
                <div className="tab-content active">
                  {results.passes && results.passes.length > 0 ? (
                    results.passes.map((pass, index) => (
                      <div key={index} className="pass">
                        <h5>{pass.id}</h5>
                        <p>{pass.description}</p>
                        <p><strong>Help:</strong> {pass.help}</p>
                      </div>
                    ))
                  ) : (
                    <p className="placeholder">No passing rules found</p>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}

export default App 