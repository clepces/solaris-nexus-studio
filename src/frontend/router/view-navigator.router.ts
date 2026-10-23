import { GlobalEventBus } from '@/state/event-bus';
import { GlobalStore } from '@/state/app-store.state';

declare global {
  interface Window {
    ViewNavigator?: {
      switchTab: (tabId: string) => void;
    };
  }
}

export class ViewNavigatorRouter {
  private activeTabId: string = 'tab-dashboard';

  constructor() {
    this.init();
  }

  private init(): void {
    window.addEventListener('hashchange', () => this.handleHashChange());
    document.addEventListener('click', (e) => this.handleNavigationClick(e));
  }

  public switchTab(targetTabId: string): void {
    if (!targetTabId) return;

    if (window.ViewNavigator && typeof window.ViewNavigator.switchTab === 'function') {
      window.ViewNavigator.switchTab(targetTabId);
    } else {
      const panels = document.querySelectorAll<HTMLElement>('.view-panel');
      panels.forEach((p) => {
        p.classList.toggle('active', p.id === targetTabId);
      });

      const navItems = document.querySelectorAll<HTMLElement>('.sidebar-nav-item');
      navItems.forEach((btn) => {
        btn.classList.toggle('active', btn.dataset.tab === targetTabId);
      });
    }

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
      this.switchTab(target.dataset.tab);
    }
  }
}

export const GlobalRouter = new ViewNavigatorRouter();
