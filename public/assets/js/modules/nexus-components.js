/**
 * Solaris Nexus Studio - UI Components Kit
 * Reusable Components: EmptyState, Pagination, Inputs & Modals
 * Clepces org. ltd | v0.4.0.0-alpha
 */
window.NexusComponents = (() => {

  /**
   * Genera el HTML de un Empty State estandarizado
   * @param {Object} options
   * @param {string} options.title Título principal
   * @param {string} options.description Subtítulo descriptivo contextual
   * @param {string} [options.icon] SVG o caracter emoji
   * @param {string} [options.actionText] Texto opcional del botón
   * @param {string} [options.actionCallback] Nombre de función global a invocar
   * @returns {string} HTML markup
   */
  function renderEmptyState({ title, description, icon = 'search', actionText = null, actionCallback = null }) {
    let iconSvg = '';
    if (icon === 'search') {
      iconSvg = `<svg viewBox="0 0 24 24" class="nexus-empty-icon"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>`;
    } else if (icon === 'folder') {
      iconSvg = `<svg viewBox="0 0 24 24" class="nexus-empty-icon"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>`;
    } else if (icon === 'inbox') {
      iconSvg = `<svg viewBox="0 0 24 24" class="nexus-empty-icon"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"></polyline><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path></svg>`;
    } else {
      iconSvg = `<div class="nexus-empty-glyph">${icon}</div>`;
    }

    const actionBtn = actionText && actionCallback
      ? `<button class="btn-row-action nexus-empty-btn" onclick="${actionCallback}">
           ${actionText}
         </button>`
      : '';

    return `
      <div class="nexus-empty-state">
        <div class="nexus-empty-icon-wrap">${iconSvg}</div>
        <div class="nexus-empty-title">${title}</div>
        <div class="nexus-empty-desc">${description}</div>
        ${actionBtn}
      </div>
    `;
  }

  /**
   * Componente de Paginación Universal
   * Genera los controles de paginación e invoca onPageChange
   */
  class Pagination {
    constructor({ container, totalItems, itemsPerPage = 10, currentPage = 1, onPageChange, idPrefix = 'pg' }) {
      this.container = typeof container === 'string' ? document.getElementById(container) : container;
      this.totalItems = totalItems;
      this.itemsPerPage = itemsPerPage;
      this.currentPage = currentPage;
      this.onPageChange = onPageChange;
      this.idPrefix = idPrefix;
    }

    setTotal(total, resetPage = false) {
      this.totalItems = total;
      if (resetPage) this.currentPage = 1;
      const totalPages = this.getTotalPages();
      if (this.currentPage > totalPages) this.currentPage = Math.max(1, totalPages);
      this.render();
    }

    setPage(page) {
      const totalPages = this.getTotalPages();
      if (page < 1) page = 1;
      if (page > totalPages) page = totalPages;
      if (page === this.currentPage) return;
      this.currentPage = page;
      this.render();
      if (typeof this.onPageChange === 'function') {
        this.onPageChange(this.currentPage, this.getSliceRange());
      }
    }

    getTotalPages() {
      return Math.max(1, Math.ceil(this.totalItems / this.itemsPerPage));
    }

    getSliceRange() {
      const start = (this.currentPage - 1) * this.itemsPerPage;
      const end = Math.min(this.totalItems, start + this.itemsPerPage);
      return { start, end };
    }

    render() {
      if (!this.container) return;
      const totalPages = this.getTotalPages();

      if (this.totalItems <= this.itemsPerPage) {
        this.container.innerHTML = `
          <div class="nexus-pagination-bar single-page">
            <span class="nexus-pagination-info">Mostrando ${this.totalItems} de ${this.totalItems} registros</span>
          </div>
        `;
        return;
      }

      const { start, end } = this.getSliceRange();
      const infoText = `Mostrando ${start + 1} - ${end} de ${this.totalItems}`;

      let pagesHtml = '';
      const range = 2; // Rango alrededor de la página actual
      let prevPage = 0;

      for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= this.currentPage - range && i <= this.currentPage + range)) {
          if (prevPage && i - prevPage > 1) {
            pagesHtml += `<span class="nexus-pagination-ellipsis">…</span>`;
          }
          const isActive = i === this.currentPage ? 'active' : '';
          pagesHtml += `<button type="button" class="nexus-pagination-page ${isActive}" data-page="${i}">${i}</button>`;
          prevPage = i;
        }
      }

      this.container.innerHTML = `
        <div class="nexus-pagination-bar">
          <span class="nexus-pagination-info">${infoText}</span>
          <div class="nexus-pagination-controls">
            <button type="button" class="nexus-pagination-btn prev" ${this.currentPage === 1 ? 'disabled' : ''} data-page="${this.currentPage - 1}">
              <svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"></polyline></svg>
              <span>Anterior</span>
            </button>
            <div class="nexus-pagination-pages">
              ${pagesHtml}
            </div>
            <button type="button" class="nexus-pagination-btn next" ${this.currentPage === totalPages ? 'disabled' : ''} data-page="${this.currentPage + 1}">
              <span>Siguiente</span>
              <svg viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </button>
          </div>
        </div>
      `;

      // Event listeners delegados
      this.container.querySelectorAll('[data-page]').forEach(el => {
        el.addEventListener('click', (e) => {
          e.preventDefault();
          const targetPage = parseInt(el.getAttribute('data-page'), 10);
          if (!isNaN(targetPage)) {
            this.setPage(targetPage);
          }
        });
      });
    }
  }

  return {
    renderEmptyState,
    Pagination
  };
})();
