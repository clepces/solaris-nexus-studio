import { GlobalRouter } from '@/router/view-navigator.router';
import { GlobalEventBus } from '@/state/event-bus';
import { GlobalStore } from '@/state/app-store.state';
import { SystemApiClient } from '@/api-client/system-api.client';

console.info('🚀 [SolarisNexus] Enterprise Frontend initialized.');

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const health = await SystemApiClient.getHealth();
    GlobalStore.setState({ systemHealth: health });
    GlobalEventBus.emit('system:ready', health);
  } catch (err) {
    console.warn('[SolarisNexus] Error al verificar estado inicial:', err);
  }
});

export { GlobalRouter, GlobalEventBus, GlobalStore };
