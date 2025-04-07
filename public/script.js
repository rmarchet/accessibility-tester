document.addEventListener('DOMContentLoaded', function () {
  // Elementi DOM
  const htmlInput = document.getElementById('html-input');
  const fileInput = document.getElementById('file-input');
  const urlInput = document.getElementById('url-input');
  const testBtn = document.getElementById('test-btn');
  const clearBtn = document.getElementById('clear-btn');
  const sampleBtn = document.getElementById('sample-btn');
  const summaryEl = document.getElementById('summary');
  const violationsEl = document.getElementById('violations');
  const passesEl = document.getElementById('passes');
  const tabBtns = document.querySelectorAll('.tab-btn');

  // Tab navigation for input methods
  const inputTabButtons = document.querySelectorAll('.input-tab-btn');
  const inputContents = document.querySelectorAll('.input-content');
  
  // Tab navigation for results
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  
  // Track current active input method
  let activeInputMethod = 'text';

  inputTabButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Update active input method
      activeInputMethod = button.getAttribute('data-input');
      
      // Update active tab button
      inputTabButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      
      // Show corresponding content
      inputContents.forEach(content => content.classList.remove('active'));
      document.getElementById(`${activeInputMethod}-input-tab`).classList.add('active');
    });
  });

  
  tabBtns.forEach(btn => {
    btn.addEventListener('click', function () {
      const tabId = this.dataset.tab;

      tabBtns.forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

      this.classList.add('active');
      document.getElementById(tabId).classList.add('active');
    });
  });
  
  // Handle file upload
  fileInput.addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file && (file.type === 'text/html' || file.name.endsWith('.html') || file.name.endsWith('.htm'))) {
      const reader = new FileReader();
      reader.onload = function(e) {
        // Populate the HTML input with file contents
        htmlInput.value = e.target.result;
      };
      reader.readAsText(file);
    } else {
      alert('Please select a valid HTML file');
      fileInput.value = '';
    }
  });
  
  const sampleHtml = `<!DOCTYPE html>
<html>
<head>
    <title>Pagina di esempio con problemi di accessibilità</title>
</head>
<body>
    <div>
        <img src="logo.png" />
        <h3>Benvenuto sul nostro sito</h3>
        <div style="color: #aaa;">
            Questo testo ha un contrasto insufficiente
        </div>
        <button onclick="alert('cliccato')">Clicca qui</button>
        <div role="button">Questo è un falso pulsante</div>
        <table>
            <tr>
                <td>Nome</td>
                <td>Email</td>
            </tr>
            <tr>
                <td>Mario Rossi</td>
                <td>mario@example.com</td>
            </tr>
        </table>
    </div>
</body>
</html>`;

  // Carica HTML di esempio
  sampleBtn.addEventListener('click', function () {
    htmlInput.value = sampleHtml;
    // Switch to text input tab
    inputTabButtons.forEach(btn => btn.classList.remove('active'));
    inputContents.forEach(content => content.classList.remove('active'));
    document.querySelector('[data-input="text"]').classList.add('active');
    document.getElementById('text-input-tab').classList.add('active');
    activeInputMethod = 'text';
  });

  
  // Clear functionality
  clearBtn.addEventListener('click', () => {
    htmlInput.value = '';
    fileInput.value = '';
    urlInput.value = '';
    
    // Reset results
    summaryEl.innerHTML = '<p>No tests run yet</p>';
    violationsEl.innerHTML = '<p class="placeholder">No violations</p>';
    passesEl.innerHTML = '<p class="placeholder">No passing rule</p>';
  });


  // Esegui test di accessibilità
  testBtn.addEventListener('click', async function () {
    let htmlToTest = '';
    
    // Get HTML based on active input method
    switch (activeInputMethod) {
      case 'text':
        htmlToTest = htmlInput.value.trim();
        if (!htmlToTest) {
          alert('Please enter some HTML to test');
          return;
        }
        break;
        
      case 'file':
        if (!fileInput.files[0]) {
          alert('Please select a file to test');
          return;
        }
        // HTML already loaded into htmlInput when file selected
        htmlToTest = htmlInput.value.trim();
        break;
        
      case 'url':
        const url = urlInput.value.trim();
        if (!url) {
          alert('Please enter a URL to test');
          return;
        }
        summaryEl.innerHTML = '<div class="spinner"></div>';
        violationsEl.innerHTML = '<div class="loading">Check in progress...</div>';
        passesEl.innerHTML = '<div class="loading">Check in progress...</div>';

        // Test URL through server
        try {
          const fetchResponse = await fetch('/api/fetch-url/fetch', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ url })
          });
    
          if (!fetchResponse.ok) {
            throw new Error('Failed to fetch URL content');
          }
          
          const result = await fetchResponse.json();
          
          if (!result.html) {
            throw new Error('No HTML content received from URL');
          }
          
          // Usa l'HTML recuperato per il test di accessibilità
          const response = await fetch('/api/accessibility/test', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ html: result.html })
          });
          
          if (!response.ok) {
            throw new Error('Error during the API request');
          }
          
          const data = await response.json();
          displayResults(data);
        } catch (error) {
          console.error('Error:', error);
          summaryEl.innerHTML = `<p>Errore: ${error.message}</p>`;
          violationsEl.innerHTML = '<p class="placeholder">An error occurred</p>';
          passesEl.innerHTML = '<p class="placeholder">An error occurred</p>';
        }
        return;
    }

    // Mostra indicatore di caricamento
    summaryEl.innerHTML = '<div class="spinner"></div>';
    violationsEl.innerHTML = '<div class="loading">Check in progress...</div>';
    passesEl.innerHTML = '<div class="loading">Check in progress...</div>';

    try {
      const response = await fetch('/api/accessibility/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ html: htmlToTest })
      });

      if (!response.ok) {
        throw new Error('Error during the API request');
      }

      const data = await response.json();
      displayResults(data);

    } catch (error) {
      console.error('Error:', error);
      summaryEl.innerHTML = `<p>Errore: ${error.message}</p>`;
      violationsEl.innerHTML = '<p class="placeholder">An error occurred</p>';
      passesEl.innerHTML = '<p class="placeholder">An error occurred</p>';
    }
  });

  // Mostra i risultati nell'interfaccia
  function displayResults(data) {
    // Aggiorna il riepilogo
    summaryEl.innerHTML = `
      <div class="summary-item summary-item-total">
        <h4>Total Criteria</h4>
        <p>${data.summary.total}</p>
      </div>
      <div class="summary-item summary-item-passes">
        <h4>Passed</h4>
        <p>${data.summary.passed}</p>
      </div>
      <div class="summary-item summary-item-violations">
        <h4>Violations</h4>
        <p>${data.summary.violations}</p>
      </div>
      `;

    // Aggiorna le violazioni
    if (data.violations.length === 0) {
      violationsEl.innerHTML = '<p class="placeholder">Nessuna violazione trovata</p>';
    } else {
      let violationsHtml = '';

      data.violations.forEach(violation => {
        let nodesHtml = '';
        violation.nodes.forEach(node => {
          nodesHtml += `
            <div class="node-item">
              <div class="html-code">${escapeHtml(node.html)}</div>
              <div class="failure-summary">${node.failureSummary}</div>
            </div>
          `;
        });

        violationsHtml += `
          <div class="violation-item">
            <h4>
              ${escapeHtml(violation.description)}
              <span class="impact ${violation.impact}">${violation.impact}</span>
            </h4>
            <p>${escapeHtml(violation.help)}</p>
            <a href="${violation.helpUrl}" target="_blank" class="help-link">Maggiori informazioni</a>
            <h5>Elementi con problemi:</h5>
            ${nodesHtml}
          </div>
          `;
      });

      violationsEl.innerHTML = violationsHtml;
    }

    // Aggiorna i criteri soddisfatti
    if (data.passes.length === 0) {
      passesEl.innerHTML = '<p class="placeholder">Nessun criterio soddisfatto</p>';
    } else {
      let passesHtml = '';

      data.passes.forEach(pass => {
        let nodesHtml = '';
        if (pass.nodes && pass.nodes.length > 0) {
          pass.nodes.forEach(node => {
            nodesHtml += `
              <div class="node-item">
                <div class="html-code">${escapeHtml(node.html)}</div>
              </div>
            `;
          });
        }
        passesHtml += `
          <div class="pass-item">
            <h4>${escapeHtml(pass.description)}</h4>
            <p>${escapeHtml(pass.help)}</p>
            <a href="${pass.helpUrl}" target="_blank" class="help-link">Maggiori informazioni</a>
            ${pass.nodes && pass.nodes.length > 0 ? 
              `<h5>Elementi che soddisfano il criterio:</h5>${nodesHtml}` : ''}
          </div>
        `;
      });

      passesEl.innerHTML = passesHtml;
    }
  }

  // Funzione per escape dell'HTML
  function escapeHtml(unsafe) {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
});