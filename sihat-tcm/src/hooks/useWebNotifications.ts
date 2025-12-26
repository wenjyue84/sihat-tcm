import { useState, useEffect, useCallback } from 'react'
import webNotificationManager from '@/lib/webNotificationManager'

interface UseWebNotificationsReturn {
  isInitialized: boolean
  permission: NotificationPermission
  preferences: any
  isLoading: boolean
  error: string | null
  initialize: () => Promise<void>
  requestPermission: () => Promise<void>
  showNotification: (options: {
    title: string
    body: string
    icon?: string
    data?: Record<string, any>
  }) => Promise<void>
  scheduleNotification: (options: {
    title: string
    body: string
    scheduledFor: Date
    category: string
    priority?: 'low' | 'normal' | 'high' | 'urgent'
    data?: Record<string, any>
  }) => Promise<string | null>
  updatePreferences: (preferences: any) => Promise<void>
  syncWithServer: () => Promise<void>
  getStats: () => any
}

export function useWebNotifications(): UseWebNotificationsReturn {
  const [isInitialized, setIsInitialized] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [preferences, setPreferences] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Initialize notification manager
  const initialize = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const result = await webNotificationManager.initialize()
      
      if (result.success) {
        setIsInitialized(true)
        const stats = webNotificationManager.getNotificationStats()
        setPermission(stats.permission)
        setPreferences(stats.preferences)
      } else {
        setError(result.error || 'Failed to initialize notifications')
      }
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Request notification permission
  const requestPermission = useCallback(async () => {
    try {
      setError(null)
      const result = await webNotificationManager.requestPermission()
      setPermission(result.permission)
      
      if (!result.granted) {
        setError('Notification permission denied')
      }
    } catch (err) {
      setError((err as Error).message)
    }
  }, [])

  // Show immediate notification
  const showNotification = useCallback(async (options: {
    title: string
    body: string
    icon?: string
    data?: Record<string, any>
  }) => {
    try {
      setError(null)
      await webNotificationManager.showNotification(options)
    } catch (err) {
      setError((err as Error).message)
    }
  }, [])

  // Schedule notification
  const scheduleNotification = useCallback(async (options: {
    title: string
    body: string
    scheduledFor: Date
    category: string
    priority?: 'low' | 'normal' | 'high' | 'urgent'
    data?: Record<string, any>
  }) => {
    try {
      setError(null)
      return await webNotificationManager.scheduleNotification(options)
    } catch (err) {
      setError((err as Error).message)
      return null
    }
  }, [])

  // Update preferences
  const updatePreferences = useCallback(async (newPreferences: any) => {
    try {
      setError(null)
      const success = await webNotificationManager.updatePreferences(newPreferences)
      
      if (success) {
        const stats = webNotificationManager.getNotificationStats()
        setPreferences(stats.preferences)
      } else {
        setError('Failed to update preferences')
      }
    } catch (err) {
      setError((err as Error).message)
    }
  }, [])

  // Sync with server
  const syncWithServer = useCallback(async () => {
    try {
      setError(null)
      const result = await webNotificationManager.syncWithServer()
      
      if (result.success) {
        const stats = webNotificationManager.getNotificationStats()
        setPreferences(stats.preferences)
      } else {
        setError(result.error || 'Sync failed')
      }
    } catch (err) {
      setError((err as Error).message)
    }
  }, [])

  // Get notification statistics
  const getStats = useCallback(() => {
    return webNotificationManager.getNotificationStats()
  }, [])

  // Initialize on mount
  useEffect(() => {
    initialize()
    
    // Cleanup on unmount
    return () => {
      webNotificationManager.cleanup()
    }
  }, [initialize])

  // Sync when page becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && isInitialized) {
        syncWithServer()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [isInitialized, syncWithServer])

  return {
    isInitialized,
    permission,
    preferences,
    isLoading,
    error,
    initialize,
    requestPermission,
    showNotification,
    scheduleNotification,
    updatePreferences,
    syncWithServer,
    getStats,
  }
}