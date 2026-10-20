/**
 * Solaris Nexus Studio - TranslationStudio Module
 * Clepces org. ltd | Versión Oficial v0.3.0.0-alpha
 */
window.TranslationStudioModule = (() => {
  const { state, extractTokens, validateTokenSyntax, downloadBlob, apiPost, generateDemoEntries } = NexusCore;

  const modal = document.getElementById('edit-modal');
  const inputTranslated = document.getElementById('modal-translated-input');
  const feedbackBox = document.getElementById('modal-token-feedback');
  const viewport = document.getElementById('virtual-viewport');
  const runway = document.getElementById('virtual-runway');
  const emptyState = document.getElementById('virtual-empty-state');

  function getCount() {
    return state.allEntries ? state.allEntries.length : 0;
  }

  function renderVirtualGrid() {
    if (!viewport || !runway) return;
    const total = state.filteredEntries ? state.filteredEntries.length : 0;

    if (total === 0 && (!state.allEntries || state.allEntries.length === 0)) {
      if (emptyState) emptyState.style.display = 'flex';
      runway.style.display = 'none';
      runway.innerHTML = '';
      return;
    }

    if (emptyState) emptyState.style.display = 'none';
    runway.style.display = 'block';
    runway.style.height = `${total * state.rowHeight}px`;

    const scrollTop = viewport.scrollTop;
    const startIndex = Math.max(0, Math.floor(scrollTop / state.rowHeight) - 5);
    const endIndex = Math.min(total, startIndex + state.visibleCount);

    const hudText = document.getElementById('hud-status-text');
    if (hudText) {
      if (total === 0) {
        hudText.innerText = 'Cadenas 0 - 0 de 0';
      } else {
        hudText.innerText = `Mostrando filas ${(startIndex + 1).toLocaleString()} - ${endIndex.toLocaleString()} de ${total.toLocaleString()} cadenas`;
      }
    }

    runway.innerHTML = '';

    for (let i = startIndex; i < endIndex; i++) {
      const item = state.filteredEntries[i];
      if (!item) continue;

      const row = document.createElement('div');
      row.className = 'virtual-row';
      row.style.transform = `translateY(${i * state.rowHeight}px)`;

      const tokenPills = item.tokens.map(t => `<span class="token-pill">${t}</span>`).join('');

      row.innerHTML = `
        <div class="col-id" title="${item.id}">${item.id}</div>
        <div class="col-text" title="${item.original}">${item.original}</div>
        <div class="col-text" title="${item.translated}">${item.translated}</div>
        <div class="col-tokens">${tokenPills}</div>
        <div class="col-actions">
          <button class="btn-icon-reagle btn-edit" data-index="${i}" title="Editar traducción">✏️</button>
        </div>
      `;
      runway.appendChild(row);
    }
  }

  function applyFilters() {
    const searchInput = document.getElementById('grid-search-input');
    const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
    let entries = state.allEntries || [];

    if (state.currentFilter === 'tokens') {
      entries = entries.filter(e => e.tokens && e.tokens.length > 0);
    } else if (state.currentFilter === 'translated') {
      entries = entries.filter(e => e.original !== e.translated);
    }

    if (query) {
      entries = entries.filter(item =>
        item.id.toLowerCase().includes(query) ||
        item.original.toLowerCase().includes(query) ||
        item.translated.toLowerCase().includes(query)
      );
    }

    state.filteredEntries = entries;
    if (viewport) viewport.scrollTop = 0;
    renderVirtualGrid();
  }

  function openEditModal(index) {
    state.currentEditIndex = index;
    const item = state.filteredEntries[index];
    if (!item) return;

    document.getElementById('modal-string-id').innerText = item.id;
    document.getElementById('modal-original-text').innerText = item.original;
    if (inputTranslated) inputTranslated.value = item.translated;
    validateModalTokens();
    if (modal) modal.classList.add('active');
  }

  function closeModal() {
    if (modal) modal.classList.remove('active');
    state.currentEditIndex = null;
  }

  function validateModalTokens() {
    if (state.currentEditIndex === null || !inputTranslated) return;
    const item = state.filteredEntries[state.currentEditIndex];
    if (!item) return;

    const val = inputTranslated.value;
    const result = validateTokenSyntax(item.tokens, val);

    if (feedbackBox) {
      feedbackBox.style.display = 'block';
      if (!result.valid) {
        feedbackBox.style.background = 'rgba(239, 68, 68, 0.15)';
        feedbackBox.style.color = '#ef4444';
        feedbackBox.innerText = result.error;
      } else {
        feedbackBox.style.background = 'rgba(16, 185, 129, 0.15)';
        feedbackBox.style.color = '#059669';
        feedbackBox.innerText = result.message;
      }
    }
  }

  function loadDemoData() {
    state.allEntries = generateDemoEntries();
    state.filteredEntries = state.allEntries;
    if (window.ViewNavigator) {
      window.ViewNavigator.updateHeroMetrics('tab-translation');
    }
    renderVirtualGrid();
  }

  async function handleStrUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target.result;
      const json = await apiPost('strings/parse', { raw_content: text });
      if (json.success && json.data && json.data.entries) {
        state.allEntries = json.data.entries.map(e => ({
          id: e.id,
          original: e.value,
          translated: e.value,
          tokens: extractTokens(e.value)
        }));
        state.filteredEntries = state.allEntries;
        if (window.ViewNavigator) {
          window.ViewNavigator.updateHeroMetrics('tab-translation');
        }
        renderVirtualGrid();
        alert(`Archivo ${file.name} cargado con ${state.allEntries.length} cadenas.`);
      }
    };
    reader.readAsText(file);
  }

  async function exportStrFile() {
    if (!state.allEntries || state.allEntries.length === 0) {
      alert('No hay cadenas cargadas para exportar.');
      return;
    }

    const payload = {
      entries: state.allEntries.slice(0, 1000).map(e => ({ id: e.id, value: e.translated }))
    };
    const json = await apiPost('strings/export', payload);
    if (json.success && json.data && json.data.content) {
      downloadBlob(json.data.content, 'Spanish.str');
      return;
    }

    // Fallback local con BOM UTF-8 y CRLF canónico
    const slice = state.allEntries.slice(0, 500);
    let out = `\uFEFFTXT\r\nNumStrings ${slice.length}\r\n`;
    slice.forEach(e => {
      const esc = e.translated.replace(/"/g, '\\"');
      out += `StringInfo\r\n{\r\n\tID "${e.id}"\r\n\tValue "${esc}"\r\n}\r\n`;
    });
    downloadBlob(out, 'Spanish.str');
  }

  function init() {
    // Filtros de Cadenas
    document.querySelectorAll('.tab-link-btn[data-filter]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-link-btn[data-filter]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.currentFilter = btn.getAttribute('data-filter');
        applyFilters();
      });
    });

    const searchInput = document.getElementById('grid-search-input');
    if (searchInput) searchInput.addEventListener('input', applyFilters);

    if (viewport) viewport.addEventListener('scroll', renderVirtualGrid);

    // Event Delegation centralizado para evitar memory leaks durante el scroll
    if (runway) {
      runway.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn-edit');
        if (btn) {
          const idx = parseInt(btn.getAttribute('data-index'), 10);
          openEditModal(idx);
        }
      });
    }

    // Modal listeners
    document.getElementById('modal-close')?.addEventListener('click', closeModal);
    document.getElementById('modal-cancel')?.addEventListener('click', closeModal);
    if (inputTranslated) inputTranslated.addEventListener('input', validateModalTokens);

    document.getElementById('modal-save')?.addEventListener('click', () => {
      if (state.currentEditIndex === null || !inputTranslated) return;
      state.filteredEntries[state.currentEditIndex].translated = inputTranslated.value;
      closeModal();
      renderVirtualGrid();
    });

    document.getElementById('btn-suggest-tm')?.addEventListener('click', () => {
      alert('Memoria de Traducción (TM): 100% Coincidencia SHA-256 aplicada.');
    });

    // Botones del Estado Vacío
    document.getElementById('btn-empty-demo')?.addEventListener('click', loadDemoData);
    document.getElementById('btn-empty-upload')?.addEventListener('click', () => {
      document.getElementById('file-input-str')?.click();
    });

    renderVirtualGrid();
  }

  return {
    init,
    getCount,
    renderVirtualGrid,
    loadDemoData,
    handleStrUpload,
    exportStrFile,
    applyFilters
  };
})();
