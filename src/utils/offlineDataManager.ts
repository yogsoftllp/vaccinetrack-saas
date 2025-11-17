import { Child, VaccinationRecord, VaccinationReminder } from '@/types/vaccination';

interface OfflineDataStore {
  children: Child[];
  vaccinations: VaccinationRecord[];
  reminders: VaccinationReminder[];
  lastUpdated: number;
  isOffline: boolean;
}

class OfflineDataManager {
  private static instance: OfflineDataManager;
  private cacheName = 'vaccinetrack-offline-data';
  private dataStore: OfflineDataStore = {
    children: [],
    vaccinations: [],
    reminders: [],
    lastUpdated: 0,
    isOffline: false
  };

  static getInstance(): OfflineDataManager {
    if (!OfflineDataManager.instance) {
      OfflineDataManager.instance = new OfflineDataManager();
    }
    return OfflineDataManager.instance;
  }

  constructor() {
    this.loadFromCache();
    this.setupOnlineOfflineListeners();
  }

  private setupOnlineOfflineListeners() {
    window.addEventListener('online', () => {
      this.dataStore.isOffline = false;
      this.syncWithServer();
    });

    window.addEventListener('offline', () => {
      this.dataStore.isOffline = true;
    });

    // Initial state
    this.dataStore.isOffline = !navigator.onLine;
  }

  private async loadFromCache() {
    try {
      const cache = await caches.open(this.cacheName);
      const response = await cache.match('/offline-data');
      
      if (response) {
        const data = await response.json();
        this.dataStore = { ...this.dataStore, ...data };
      }
    } catch (error) {
      console.warn('Failed to load offline data from cache:', error);
    }
  }

  private async saveToCache() {
    try {
      const cache = await caches.open(this.cacheName);
      const response = new Response(JSON.stringify(this.dataStore), {
        headers: { 'Content-Type': 'application/json' }
      });
      
      await cache.put('/offline-data', response);
    } catch (error) {
      console.warn('Failed to save offline data to cache:', error);
    }
  }

  // Sync data with server when online
  async syncWithServer() {
    if (this.dataStore.isOffline) return;

    try {
      // Get latest data from server
      const token = localStorage.getItem('parentToken');
      if (!token) return;

      const [childrenRes, vaccinationsRes, remindersRes] = await Promise.all([
        fetch('/api/parent-dashboard/children', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/parent-dashboard/vaccinations', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/parent-dashboard/reminders', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (childrenRes.ok && vaccinationsRes.ok && remindersRes.ok) {
        const [children, vaccinations, reminders] = await Promise.all([
          childrenRes.json(),
          vaccinationsRes.json(),
          remindersRes.json()
        ]);

        this.dataStore.children = children.children || [];
        this.dataStore.vaccinations = vaccinations.vaccinations || [];
        this.dataStore.reminders = reminders.reminders || [];
        this.dataStore.lastUpdated = Date.now();

        await this.saveToCache();
      }
    } catch (error) {
      console.warn('Failed to sync with server:', error);
    }
  }

  // Get cached data
  getCachedData(): OfflineDataStore {
    return { ...this.dataStore };
  }

  // Get children (with offline fallback)
  getChildren(): Child[] {
    return this.dataStore.children;
  }

  // Get vaccinations for a specific child
  getVaccinations(childId: string): VaccinationRecord[] {
    return this.dataStore.vaccinations.filter(v => v.child_id === childId);
  }

  // Get upcoming reminders
  getUpcomingReminders(daysAhead: number = 30): VaccinationReminder[] {
    const now = new Date();
    const futureDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);
    
    return this.dataStore.reminders.filter(reminder => {
      const reminderDate = new Date(reminder.scheduled_date);
      return reminderDate >= now && reminderDate <= futureDate && !reminder.completed;
    }).sort((a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime());
  }

  // Add child offline (will sync when online)
  async addChild(child: Child) {
    this.dataStore.children.push(child);
    this.dataStore.lastUpdated = Date.now();
    await this.saveToCache();
    
    // Queue for sync if online
    if (!this.dataStore.isOffline) {
      this.queueSyncAction('add-child', child);
    }
  }

  // Update vaccination status offline
  async updateVaccinationStatus(vaccinationId: string, completed: boolean, completedDate?: string) {
    const vaccination = this.dataStore.vaccinations.find(v => v.id === vaccinationId);
    if (vaccination) {
      vaccination.completed = completed;
      vaccination.completed_date = completedDate || new Date().toISOString();
      this.dataStore.lastUpdated = Date.now();
      await this.saveToCache();
    }

    if (!this.dataStore.isOffline) {
      this.queueSyncAction('update-vaccination', { vaccinationId, completed, completedDate });
    }
  }

  // Queue sync actions
  private async queueSyncAction(action: string, data: any) {
    try {
      const cache = await caches.open('vaccinetrack-sync-queue');
      const syncData = {
        action,
        data,
        timestamp: Date.now(),
        id: `${action}-${Date.now()}-${Math.random()}`
      };
      
      await cache.put(syncData.id, new Response(JSON.stringify(syncData), {
        headers: { 'Content-Type': 'application/json' }
      }));

      // Trigger background sync
      if ('sync' in self.registration) {
        await self.registration.sync.register('sync-vaccination-data');
      }
    } catch (error) {
      console.warn('Failed to queue sync action:', error);
    }
  }

  // Get sync queue
  async getSyncQueue(): Promise<any[]> {
    try {
      const cache = await caches.open('vaccinetrack-sync-queue');
      const requests = await cache.keys();
      const queue: any[] = [];
      
      for (const request of requests) {
        const response = await cache.match(request);
        if (response) {
          const data = await response.json();
          queue.push(data);
        }
      }
      
      return queue.sort((a, b) => a.timestamp - b.timestamp);
    } catch (error) {
      console.warn('Failed to get sync queue:', error);
      return [];
    }
  }

  // Clear sync queue
  async clearSyncQueue() {
    try {
      const cache = await caches.open('vaccinetrack-sync-queue');
      await cache.keys().then(keys => 
        Promise.all(keys.map(key => cache.delete(key)))
      );
    } catch (error) {
      console.warn('Failed to clear sync queue:', error);
    }
  }

  // Check if data is stale (older than 24 hours)
  isDataStale(): boolean {
    const STALE_THRESHOLD = 24 * 60 * 60 * 1000; // 24 hours
    return Date.now() - this.dataStore.lastUpdated > STALE_THRESHOLD;
  }

  // Force refresh data
  async forceRefresh() {
    if (!this.dataStore.isOffline) {
      await this.syncWithServer();
    }
  }
}

export const offlineDataManager = OfflineDataManager.getInstance();
export default offlineDataManager;