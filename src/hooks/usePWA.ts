import { useEffect, useState } from 'react';

interface PWAInstallPrompt {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface UsePWAInstallReturn {
  isInstallable: boolean;
  installPrompt: PWAInstallPrompt | null;
  installApp: () => Promise<void>;
  isInstalled: boolean;
}

export function usePWAInstall(): UsePWAInstallReturn {
  const [installPrompt, setInstallPrompt] = useState<PWAInstallPrompt | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as any);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const installApp = async () => {
    if (!installPrompt) return;

    try {
      await installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
    } catch (error) {
      console.error('Install prompt failed:', error);
    }
  };

  return {
    isInstallable: !!installPrompt,
    installPrompt,
    installApp,
    isInstalled
  };
}

interface ServiceWorkerRegistration {
  installing?: ServiceWorker;
  waiting?: ServiceWorker;
  active?: ServiceWorker;
}

interface UseServiceWorkerReturn {
  isSupported: boolean;
  registration: ServiceWorkerRegistration | null;
  isOffline: boolean;
  syncStatus: 'idle' | 'syncing' | 'synced' | 'error';
  updateServiceWorker: () => Promise<void>;
}

export function useServiceWorker(): UseServiceWorkerReturn {
  const [isSupported, setIsSupported] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');

  useEffect(() => {
    setIsSupported('serviceWorker' in navigator);

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    const handleSyncComplete = (event: MessageEvent) => {
      if (event.data?.type === 'SYNC_COMPLETE') {
        setSyncStatus('synced');
        setTimeout(() => setSyncStatus('idle'), 3000);
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    navigator.serviceWorker.addEventListener('message', handleSyncComplete);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      navigator.serviceWorker.removeEventListener('message', handleSyncComplete);
    };
  }, []);

  useEffect(() => {
    if (!isSupported) return;

    const registerServiceWorker = async () => {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js');
        setRegistration(reg);

        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New content available, show update notification
                console.log('New content available, please refresh');
              }
            });
          }
        });
      } catch (error) {
        console.error('Service worker registration failed:', error);
      }
    };

    registerServiceWorker();
  }, [isSupported]);

  const updateServiceWorker = async () => {
    if (!registration?.waiting) return;

    try {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    } catch (error) {
      console.error('Service worker update failed:', error);
    }
  };

  const triggerSync = async () => {
    if (!isSupported || isOffline) return;

    try {
      setSyncStatus('syncing');
      await registration?.active?.postMessage({ type: 'TRIGGER_SYNC' });
    } catch (error) {
      setSyncStatus('error');
      console.error('Sync failed:', error);
    }
  };

  return {
    isSupported,
    registration,
    isOffline,
    syncStatus,
    updateServiceWorker,
    triggerSync
  };
}