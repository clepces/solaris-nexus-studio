export interface ModalOptions {
  id: string;
  title: string;
  content: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

export class ModalComponent {
  private element: HTMLElement | null = null;

  constructor(private readonly options: ModalOptions) {}

  public open(): void {
    let existing = document.getElementById(this.options.id);
    if (!existing) {
      const wrapper = document.createElement('div');
      wrapper.id = this.options.id;
      wrapper.className = 'modal-overlay';
      wrapper.innerHTML = `
        <div class="modal-card">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <h3 style="font-size: 1.15rem; font-weight: 800; color: var(--text-blue);">${this.options.title}</h3>
            <button class="btn-icon-reagle modal-close-btn">&times;</button>
          </div>
          <div class="modal-body" style="margin: 14px 0;">${this.options.content}</div>
          <div style="display: flex; justify-content: flex-end; gap: 10px;">
            <button class="btn-reagle modal-cancel-btn">${this.options.cancelLabel ?? 'Cancelar'}</button>
            <button class="btn-reagle btn-reagle-primary modal-confirm-btn">${this.options.confirmLabel ?? 'Aceptar'}</button>
          </div>
        </div>
      `;
      document.body.appendChild(wrapper);
      existing = wrapper;

      existing.querySelector('.modal-close-btn')?.addEventListener('click', () => this.close());
      existing.querySelector('.modal-cancel-btn')?.addEventListener('click', () => {
        this.options.onCancel?.();
        this.close();
      });
      existing.querySelector('.modal-confirm-btn')?.addEventListener('click', () => {
        this.options.onConfirm?.();
        this.close();
      });
    }

    this.element = existing;
    this.element.style.display = 'flex';
  }

  public close(): void {
    if (this.element) {
      this.element.style.display = 'none';
    }
  }
}
