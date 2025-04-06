document.addEventListener('DOMContentLoaded', function () {
  // Elementi DOM
  const htmlInput = document.getElementById('html-input');
  const testBtn = document.getElementById('test-btn');
  const clearBtn = document.getElementById('clear-btn');
  const sampleBtn = document.getElementById('sample-btn');
  const summaryEl = document.getElementById('summary');
  const violationsEl = document.getElementById('violations');
  const passesEl = document.getElementById('passes');
  const tabBtns = document.querySelectorAll('.tab-btn');

  // Gestione cambio tab
  tabBtns.forEach(btn => {
    btn.addEventListener('click', function () {
      const tabId = this.dataset.tab;

      // Rimuovi classe active da tutti i pulsanti e contenuti
      tabBtns.forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

      // Aggiungi classe active al pulsante e contenuto corrente
      this.classList.add('active');
      document.getElementById(tabId).classList.add('active');
    });
  });

  // Esempio di HTML con problemi di accessibilità
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
  });

  // Pulisci form e risultati
  clearBtn.addEventListener('click', function () {
    htmlInput.value = '';
    clearResults();
  });

  // Funzione per pulire i risultati
  function clearResults() {
    summaryEl.innerHTML = '<p>No test run</p>';
    violationsEl.innerHTML = '<p class="placeholder">No violations found</p>';
    passesEl.innerHTML = '<p class="placeholder">No passing rule</p>';
  }

  // Esegui test di accessibilità
  testBtn.addEventListener('click', async function () {
    const html = htmlInput.value.trim();

    if (!html) {
      alert('Inserisci il codice HTML da testare');
      return;
    }

    // Mostra indicatore di caricamento
    summaryEl.innerHTML = '<div class="spinner"></div>';
    violationsEl.innerHTML = '<div class="loading">Analisi in corso...</div>';
    passesEl.innerHTML = '<div class="loading">Analisi in corso...</div>';

    try {
      const response = await fetch('/api/accessibility/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ html })
      });

      if (!response.ok) {
        throw new Error('Errore durante la richiesta API');
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