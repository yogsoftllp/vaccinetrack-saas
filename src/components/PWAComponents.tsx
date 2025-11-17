import { useEffect, useState } from 'react';
import { X, Download, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { usePWAInstall, useServiceWorker } from '@/hooks/usePWA';
import { offlineDataManager } from '@/utils/offlineDataManager';

export function PWAInstallPrompt() {
  const { isInstallable, installApp, isInstalled } = usePWAInstall();
  const [showPrompt, setShowPrompt] = useState(false);
  const [isDismissing, setIsDismissing] = useState(false);

  useEffect(() => {
    // Show prompt after 3 seconds if installable and not installed
    if (isInstallable && !isInstalled) {
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isInstallable, isInstalled]);

  const handleInstall = async () => {
    try {
      await installApp();
      setShowPrompt(false);
    } catch (error) {
      console.error('Installation failed:', error);
    }
  };

  const handleDismiss = () => {
    setIsDismissing(true);
    setTimeout(() => {
      setShowPrompt(false);
      setIsDismissing(false);
      // Store dismissal in localStorage to prevent showing again for a while
      localStorage.setItem('pwa-install-dismissed', Date.now().toString());
    }, 300);
  };

  if (!showPrompt || isInstalled) return null;

  // Check if dismissed recently (within 7 days)
  const dismissedAt = localStorage.getItem('pwa-install-dismissed');
  if (dismissedAt && (Date.now() - parseInt(dismissedAt)) < 7 * 24 * 60 * 60 * 1000) {
    return null;
  }

  return (
    <div className={`fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50 transition-all duration-300 ${isDismissing ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <Download className="w-6 h-6 text-blue-600" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-gray-900">Install VaccineTrack</h3>
          <p className="text-sm text-gray-500 mt-1">
            Get quick access to vaccination schedules and reminders. Works offline!
          </p>
          <div className="mt-3 flex space-x-2">
            <button
              onClick={handleInstall}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Download className="w-4 h-4 mr-2" />
              Install
            </button>
            <button
              onClick={handleDismiss}
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Later
            </button>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 text-gray-400 hover:text-gray-500"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

export function OfflineStatusIndicator() {
  const { isOffline, syncStatus } = useServiceWorker();
  const [showOfflineBanner, setShowOfflineBanner] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  useEffect(() => {
    if (isOffline) {
      setShowOfflineBanner(true);
    } else {
      // Hide banner after 3 seconds when back online
      const timer = setTimeout(() => {
        setShowOfflineBanner(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOffline]);

  useEffect(() => {
    // Load last sync time
    const syncTime = localStorage.getItem('last-sync-time');
    if (syncTime) {
      setLastSyncTime(new Date(parseInt(syncTime)));
    }
  }, []);

  const handleRefresh = async () => {
    try {
      await offlineDataManager.forceRefresh();
      localStorage.setItem('last-sync-time', Date.now().toString());
      setLastSyncTime(new Date());
    } catch (error) {
      console.error('Failed to refresh data:', error);
    }
  };

  if (!showOfflineBanner && syncStatus === 'idle') return null;

  return (
    <div className={`fixed top-4 left-4 right-4 sm:left-auto sm:right-4 z-40 transition-all duration-300 ${showOfflineBanner ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}>
      {isOffline ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <WifiOff className="w-5 h-5 text-yellow-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-800">You're offline</p>
              <p className="text-sm text-yellow-600">
                Showing cached data. Some features may be limited.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <Wifi className="w-5 h-5 text-green-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-800">Back online!</p>
              <p className="text-sm text-green-600">
                {syncStatus === 'synced' ? 'Data synced successfully' : 'Reconnecting...'}
              </p>
            </div>
            <button
              onClick={handleRefresh}
              className="text-green-600 hover:text-green-700"
              title="Refresh data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function SyncStatusIndicator() {
  const { isOffline, syncStatus, triggerSync } = useServiceWorker();
  const [syncQueue, setSyncQueue] = useState<any[]>([]);

  useEffect(() => {
    const loadSyncQueue = async () => {
      try {
        const queue = await offlineDataManager.getSyncQueue();
        setSyncQueue(queue);
      } catch (error) {
        console.warn('Failed to load sync queue:', error);
      }
    };

    if (!isOffline && syncStatus === 'idle') {
      loadSyncQueue();
    }
  }, [isOffline, syncStatus]);

  if (syncQueue.length === 0) return null;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          <p className="text-sm text-blue-800">
            {syncQueue.length} {syncQueue.length === 1 ? 'change' : 'changes'} pending sync
          </p>
        </div>
        <button
          onClick={triggerSync}
          disabled={isOffline || syncStatus === 'syncing'}
          className="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50"
        >
          {syncStatus === 'syncing' ? 'Syncing...' : 'Sync now'}
        </button>
      </div>
    </div>
  );
}

export function PWASettings() {
  const { isSupported, updateServiceWorker } = useServiceWorker();
  const [syncQueue, setSyncQueue] = useState<any[]>([]);
  const [isDataStale, setIsDataStale] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const queue = await offlineDataManager.getSyncQueue();
        setSyncQueue(queue);
        setIsDataStale(offlineDataManager.isDataStale());
      } catch (error) {
        console.warn('Failed to load PWA data:', error);
      }
    };

    loadData();
  }, []);

  const handleClearCache = async () => {
    try {
      await offlineDataManager.clearSyncQueue();
      setSyncQueue([]);
      
      // Clear browser cache
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }
      
      // Reload to get fresh data
      window.location.reload();
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  };

  const handleForceSync = async () => {
    try {
      await offlineDataManager.forceRefresh();
      setSyncQueue([]);
      setIsDataStale(false);
    } catch (error) {
      console.error('Failed to force sync:', error);
    }
  };

  if (!isSupported) {
    return (
      <div className="text-sm text-gray-500">
        PWA features are not supported in your browser.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Offline Data</h4>
        
        {isDataStale && (
          <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">Your cached data is older than 24 hours.</p>
          </div>
        )}

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Pending sync:</span>
            <span className="font-medium">{syncQueue.length} items</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Data status:</span>
            <span className={`font-medium ${isDataStale ? 'text-yellow-600' : 'text-green-600'}`}>
              {isDataStale ? 'Stale' : 'Fresh'}
            </span>
          </div>
        </div>

        <div className="mt-4 flex space-x-2">
          <button
            onClick={handleForceSync}
            className="px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
          >
            Refresh Data
          </button>
          <button
            onClick={handleClearCache}
            className="px-3 py-2 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700"
          >
            Clear Cache
          </button>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Service Worker</h4>
        <button
          onClick={updateServiceWorker}
          className="px-3 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
        >
          Check for Updates
        </button>
      </div>
    </div>
  );
}