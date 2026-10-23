import { GlobalEventBus } from '@/state/event-bus';
import { GlobalStore } from '@/state/app-store.state';

export class ViewNavigatorRouter {
  private activeTabId: string = 'tab-dashboard';

  constructor() {
    this.init();
  }

  private init(): void {
    window.addEventListener('hashchange', () => this.handleHashChange());
    document.addEventListener('click', (e) => this.handleNavigationClick(e));

    // Carga inicial basada en URL hash o estado por defecto
    const initialHash = window.location.hash.replace('#', '');
    if (initialHash && document.getElementById(initialHash)) {
      this.switchTab(initialHash);
    } else {
      this.switchTab('tab-dashboard');
    }
  }

  public switchTab(targetTabId: string): void {
    if (!targetTabId) return;

    const panels = document.querySelectorAll<HTMLElement>('.view-panel');
    panels.forEach((p) => {
      p.classList.remove('active');
      p.style.display = 'none';
    });

    const targetPanel = document.getElementById(targetTabId);
    if (targetPanel) {
      targetPanel.classList.add('active');
      targetPanel.style.display = 'block';
    }

    // Sincronizar botones de la barra lateral
    const navItems = document.querySelectorAll<HTMLElement>('.sidebar-nav-item');
    navItems.forEach((btn) => {
      if (btn.dataset.tab === targetTabId) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    this.activeTabId = targetTabId;
    GlobalStore.setActiveTab(targetTabId);
    GlobalEventBus.emit('router:navigated', targetTabId);

    if (window.location.hash !== `#${targetTabId}`) {
      window.history.replaceState(null, '', `#${targetTabId}`);
    }
  }

  public getActiveTab(): string {
    return this.activeTabId;
  }

  private handleHashChange(): void {
    const hash = window.location.hash.replace('#', '');
    if (hash && hash !== this.activeTabId) {
      this.switchTab(hash);
    }
  }

  private handleNavigationClick(e: MouseEvent): void {
    const target = (e.target as HTMLElement).closest<HTMLElement>('[data-tab]');
    if (target && target.dataset.tab) {
      e.preventDefault();
      this.switchTab(target.dataset.tab);
    }
  }
}

export const GlobalRouter = new ViewNavigatorRouter();
