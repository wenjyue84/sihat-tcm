'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { 
  Bell, 
  BellOff, 
  Clock, 
  Heart, 
  Pill, 
  Calendar, 
  Activity, 
  Moon, 
  Utensils,
  AlertTriangle,
  CheckCircle,
  Settings
} from 'lucide-react'
import { useWebNotifications } from '@/hooks/useWebNotifications'

interface WebNotificationSettingsProps {
  className?: string
}

export default function WebNotificationSettings({ className }: WebNotificationSettingsProps) {
  const {
    isInitialized,
    permission,
    preferences,
    isLoading,
    error,
    requestPermission,
    showNotification,
    updatePreferences,
    syncWithServer,
    getStats
  } = useWebNotifications()

  const [localPreferences, setLocalPreferences] = useState(preferences)
  const [stats, setStats] = useState<any>({})
  const [isSaving, setIsSaving] = useState(false)

  // Update local preferences when global preferences change
  useEffect(() => {
    setLocalPreferences(preferences)
  }, [preferences])

  // Load stats
  useEffect(() => {
    if (isInitialized) {
      setStats(getStats())
    }
  }, [isInitialized, getStats])

  const handlePreferenceChange = (key: string, value: any) => {
    setLocalPreferences(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleNestedPreferenceChange = (parentKey: string, childKey: string, value: any) => {
    setLocalPreferences(prev => ({
      ...prev,
      [parentKey]: {
        ...prev[parentKey],
        [childKey]: value
      }
    }))
  }

  const handleSavePreferences = async () => {
    try {
      setIsSaving(true)
      await updatePreferences(localPreferences)
      await syncWithServer()
    } catch (err) {
      console.error('Failed to save preferences:', err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleTestNotification = async () => {
    try {
      await showNotification({
        title: '🌿 Sihat TCM Test',
        body: 'This is a test notification from your TCM health companion.',
        icon: '/logo.png',
        data: { type: 'test', timestamp: Date.now() }
      })
    } catch (err) {
      console.error('Failed to send test notification:', err)
    }
  }

  const getPermissionBadge = () => {
    switch (permission) {
      case 'granted':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Granted</Badge>
      case 'denied':
        return <Badge variant="destructive"><BellOff className="w-3 h-3 mr-1" />Denied</Badge>
      default:
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>
    }
  }

  const getCategoryIcon = (category: string) => {
    const icons = {
      health: Heart,
      medication: Pill,
      exercise: Activity,
      diet: Utensils,
      sleep: Moon,
      appointments: Calendar
    }
    return icons[category] || Bell
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notification Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Notification Settings
        </CardTitle>
        <CardDescription>
          Manage your notification preferences and cross-device synchronization
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Permission Status */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-base font-medium">Permission Status</Label>
            {getPermissionBadge()}
          </div>
          
          {permission !== 'granted' && (
            <Button 
              onClick={requestPermission}
              variant="outline"
              className="w-full"
            >
              <Bell className="w-4 h-4 mr-2" />
              Enable Notifications
            </Button>
          )}
        </div>

        <Separator />

        {/* General Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">General Settings</h3>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Enable Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive health reminders and alerts
              </p>
            </div>
            <Switch
              checked={localPreferences.enabled || false}
              onCheckedChange={(checked) => handlePreferenceChange('enabled', checked)}
            />
          </div>
        </div>

        <Separator />

        {/* Notification Categories */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Notification Categories</h3>
          
          {Object.entries(localPreferences.categories || {}).map(([category, enabled]) => {
            const IconComponent = getCategoryIcon(category)
            return (
              <div key={category} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <IconComponent className="w-4 h-4 text-muted-foreground" />
                  <div className="space-y-0.5">
                    <Label className="text-base capitalize">{category}</Label>
                    <p className="text-sm text-muted-foreground">
                      {getCategoryDescription(category)}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={enabled as boolean}
                  onCheckedChange={(checked) => 
                    handleNestedPreferenceChange('categories', category, checked)
                  }
                />
              </div>
            )
          })}
        </div>

        <Separator />

        {/* Quiet Hours */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Quiet Hours</h3>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Enable Quiet Hours</Label>
              <p className="text-sm text-muted-foreground">
                Pause notifications during specified hours
              </p>
            </div>
            <Switch
              checked={localPreferences.quietHours?.enabled || false}
              onCheckedChange={(checked) => 
                handleNestedPreferenceChange('quietHours', 'enabled', checked)
              }
            />
          </div>

          {localPreferences.quietHours?.enabled && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Time</Label>
                <input
                  type="time"
                  value={localPreferences.quietHours?.start || '22:00'}
                  onChange={(e) => 
                    handleNestedPreferenceChange('quietHours', 'start', e.target.value)
                  }
                  className="w-full px-3 py-2 border border-input rounded-md"
                />
              </div>
              <div className="space-y-2">
                <Label>End Time</Label>
                <input
                  type="time"
                  value={localPreferences.quietHours?.end || '07:00'}
                  onChange={(e) => 
                    handleNestedPreferenceChange('quietHours', 'end', e.target.value)
                  }
                  className="w-full px-3 py-2 border border-input rounded-md"
                />
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* Frequency Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Frequency Settings</h3>
          
          {Object.entries(localPreferences.frequency || {}).map(([freq, enabled]) => (
            <div key={freq} className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base capitalize">{freq}</Label>
                <p className="text-sm text-muted-foreground">
                  Receive {freq} notifications
                </p>
              </div>
              <Switch
                checked={enabled as boolean}
                onCheckedChange={(checked) => 
                  handleNestedPreferenceChange('frequency', freq, checked)
                }
              />
            </div>
          ))}
        </div>

        <Separator />

        {/* Statistics */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Statistics</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-primary">{stats.totalScheduled || 0}</div>
              <div className="text-sm text-muted-foreground">Scheduled</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-primary">{stats.totalReceived || 0}</div>
              <div className="text-sm text-muted-foreground">Received</div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button 
            onClick={handleTestNotification}
            variant="outline"
            className="flex-1"
            disabled={permission !== 'granted'}
          >
            <Bell className="w-4 h-4 mr-2" />
            Test Notification
          </Button>
          
          <Button 
            onClick={syncWithServer}
            variant="outline"
            className="flex-1"
          >
            <Settings className="w-4 h-4 mr-2" />
            Sync Devices
          </Button>
        </div>

        <Button 
          onClick={handleSavePreferences}
          className="w-full"
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Saving...
            </>
          ) : (
            'Save Settings'
          )}
        </Button>
      </CardContent>
    </Card>
  )
}

function getCategoryDescription(category: string): string {
  const descriptions = {
    health: 'General health tips and reminders',
    medication: 'Herbal medicine and supplement reminders',
    exercise: 'Qi exercises and physical activity',
    diet: 'Nutritional advice and meal planning',
    sleep: 'Sleep hygiene and rest reminders',
    appointments: 'Consultation and appointment reminders'
  }
  return descriptions[category] || 'Notification category'
}