'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Bell, Moon, UtensilsCrossed, Clock, Info } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import webNotificationManager from '@/lib/webNotificationManager';

interface SleepReminderPreferences {
  sleep_cultivation_enabled: boolean;
  sleep_time: string; // HH:mm format
  dinner_cutoff_time: string; // HH:mm format
  sleep_reminder_enabled: boolean;
  dinner_reminder_enabled: boolean;
}

export function SleepCultivationReminder() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<SleepReminderPreferences>({
    sleep_cultivation_enabled: false,
    sleep_time: '22:00',
    dinner_cutoff_time: '19:00',
    sleep_reminder_enabled: true,
    dinner_reminder_enabled: true,
  });

  // Load preferences on mount
  useEffect(() => {
    loadPreferences();
  }, []);

  // Update dinner cutoff time when sleep time changes (3 hours before)
  useEffect(() => {
    if (preferences.sleep_cultivation_enabled) {
      const sleepTime = parseTime(preferences.sleep_time);
      const dinnerTime = subtractHours(sleepTime, 3);
      setPreferences(prev => ({
        ...prev,
        dinner_cutoff_time: formatTime(dinnerTime),
      }));
    }
  }, [preferences.sleep_time, preferences.sleep_cultivation_enabled]);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('Not authenticated');
      }

      // Fetch notification preferences
      const { data, error } = await supabase
        .from('user_notification_preferences')
        .select('sleep_cultivation_enabled, sleep_time, dinner_cutoff_time, sleep_reminder_enabled, dinner_reminder_enabled')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setPreferences({
          sleep_cultivation_enabled: data.sleep_cultivation_enabled ?? false,
          sleep_time: data.sleep_time ? formatTimeFromDB(data.sleep_time) : '22:00',
          dinner_cutoff_time: data.dinner_cutoff_time ? formatTimeFromDB(data.dinner_cutoff_time) : '19:00',
          sleep_reminder_enabled: data.sleep_reminder_enabled ?? true,
          dinner_reminder_enabled: data.dinner_reminder_enabled ?? true,
        });
      }
    } catch (error: any) {
      console.error('Failed to load preferences:', error);
      toast.error('Failed to load sleep reminder settings');
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    try {
      setSaving(true);
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('Not authenticated');
      }

      // Upsert preferences
      const { error } = await supabase
        .from('user_notification_preferences')
        .upsert({
          user_id: user.id,
          sleep_cultivation_enabled: preferences.sleep_cultivation_enabled,
          sleep_time: formatTimeToDB(preferences.sleep_time),
          dinner_cutoff_time: formatTimeToDB(preferences.dinner_cutoff_time),
          sleep_reminder_enabled: preferences.sleep_reminder_enabled,
          dinner_reminder_enabled: preferences.dinner_reminder_enabled,
        }, {
          onConflict: 'user_id',
        });

      if (error) throw error;

      // Schedule/cancel notifications based on preferences
      if (preferences.sleep_cultivation_enabled) {
        await scheduleReminders();
      } else {
        await cancelReminders();
      }

      toast.success('Sleep cultivation reminders updated');
    } catch (error: any) {
      console.error('Failed to save preferences:', error);
      toast.error('Failed to save sleep reminder settings');
    } finally {
      setSaving(false);
    }
  };

  const scheduleReminders = async () => {
    try {
      // Initialize notification manager if needed
      const initResult = await webNotificationManager.initialize();
      if (!initResult.success) {
        toast.error('Please enable notifications in your browser settings');
        return;
      }

      // Cancel existing reminders first
      await cancelReminders();

      if (preferences.sleep_reminder_enabled) {
        // Schedule sleep reminder (daily)
        const sleepTime = parseTime(preferences.sleep_time);
        const sleepDate = getNextOccurrence(sleepTime);
        
        // Schedule via API for server-side persistence
        const response = await fetch('/api/notifications/schedule', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            notification_type: 'sleep_cultivation',
            title: '🌙 Time to Sleep - Preserve Your Shen',
            body: 'According to TCM, the Heart houses the Shen (Spirit). It\'s time to rest and let your Shen settle. Follow the organ clock for optimal sleep.',
            scheduled_for: sleepDate.toISOString(),
            category: 'sleep',
            priority: 'high',
            repeat_pattern: 'daily',
            data: {
              type: 'sleep_cultivation',
              reminder_type: 'sleep_time',
            },
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to schedule sleep reminder');
        }

        // Also schedule locally for immediate display
        await webNotificationManager.scheduleNotification({
          title: '🌙 Time to Sleep - Preserve Your Shen',
          body: 'According to TCM, the Heart houses the Shen (Spirit). It\'s time to rest and let your Shen settle. Follow the organ clock for optimal sleep.',
          scheduledFor: sleepDate,
          category: 'sleep',
          priority: 'high',
          repeatPattern: 'daily',
          data: {
            type: 'sleep_cultivation',
            reminder_type: 'sleep_time',
          },
        });
      }

      if (preferences.dinner_reminder_enabled) {
        // Schedule dinner cutoff reminder (daily)
        const dinnerTime = parseTime(preferences.dinner_cutoff_time);
        const dinnerDate = getNextOccurrence(dinnerTime);
        
        // Schedule via API for server-side persistence
        const response = await fetch('/api/notifications/schedule', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            notification_type: 'sleep_cultivation',
            title: '🍽️ Stop Eating Now - Preserve Stomach Qi',
            body: 'In TCM, digestion consumes Stomach Qi. Stop eating 3 hours before sleep to allow Stomach Qi to complete its work and protect Heart Shen. "When Stomach is not at peace, Heart cannot rest" (胃不和则卧不安).',
            scheduled_for: dinnerDate.toISOString(),
            category: 'sleep',
            priority: 'normal',
            repeat_pattern: 'daily',
            data: {
              type: 'sleep_cultivation',
              reminder_type: 'dinner_cutoff',
            },
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to schedule dinner reminder');
        }

        // Also schedule locally for immediate display
        await webNotificationManager.scheduleNotification({
          title: '🍽️ Stop Eating Now - Preserve Stomach Qi',
          body: 'In TCM, digestion consumes Stomach Qi. Stop eating 3 hours before sleep to allow Stomach Qi to complete its work and protect Heart Shen. "When Stomach is not at peace, Heart cannot rest" (胃不和则卧不安).',
          scheduledFor: dinnerDate,
          category: 'sleep',
          priority: 'normal',
          repeatPattern: 'daily',
          data: {
            type: 'sleep_cultivation',
            reminder_type: 'dinner_cutoff',
          },
        });
      }
    } catch (error: any) {
      console.error('Failed to schedule reminders:', error);
      toast.error('Failed to schedule notifications. Please check notification permissions.');
    }
  };

  const cancelReminders = async () => {
    try {
      // Cancel all sleep cultivation notifications from server
      const response = await fetch('/api/notifications/schedule?type=sleep_cultivation', {
        method: 'DELETE',
      });

      if (!response.ok) {
        console.warn('Failed to cancel server reminders');
      }
    } catch (error: any) {
      console.error('Failed to cancel reminders:', error);
    }
  };

  // Helper functions
  const parseTime = (timeString: string): { hours: number; minutes: number } => {
    const [hours, minutes] = timeString.split(':').map(Number);
    return { hours, minutes };
  };

  const formatTime = (time: { hours: number; minutes: number }): string => {
    return `${time.hours.toString().padStart(2, '0')}:${time.minutes.toString().padStart(2, '0')}`;
  };

  const formatTimeFromDB = (dbTime: string): string => {
    // Convert "HH:mm:ss" to "HH:mm"
    return dbTime.substring(0, 5);
  };

  const formatTimeToDB = (time: string): string => {
    // Convert "HH:mm" to "HH:mm:ss"
    return `${time}:00`;
  };

  const subtractHours = (time: { hours: number; minutes: number }, hours: number): { hours: number; minutes: number } => {
    let totalMinutes = time.hours * 60 + time.minutes - (hours * 60);
    if (totalMinutes < 0) totalMinutes += 24 * 60; // Wrap around
    return {
      hours: Math.floor(totalMinutes / 60) % 24,
      minutes: totalMinutes % 60,
    };
  };

  const getNextOccurrence = (time: { hours: number; minutes: number }): Date => {
    const now = new Date();
    const target = new Date();
    target.setHours(time.hours, time.minutes, 0, 0);
    
    // If time has passed today, schedule for tomorrow
    if (target <= now) {
      target.setDate(target.getDate() + 1);
    }
    
    return target;
  };

  const handleTimeChange = (type: 'sleep' | 'dinner', value: string) => {
    if (type === 'sleep') {
      setPreferences(prev => ({ ...prev, sleep_time: value }));
    } else {
      setPreferences(prev => ({ ...prev, dinner_cutoff_time: value }));
    }
  };

  if (loading) {
    return (
      <Card className="bg-white border-0 shadow-[0_2px_8px_rgba(0,0,0,0.04)] rounded-[20px] p-6">
        <div className="flex items-center justify-center py-8">
          <div className="text-sm text-slate-500">Loading settings...</div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-white border-0 shadow-[0_2px_8px_rgba(0,0,0,0.04)] rounded-[20px] overflow-hidden">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-[12px] bg-indigo-50 flex items-center justify-center">
            <Bell className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-[18px] font-medium text-slate-900 leading-[1.47]">
              Sleep Cultivation Reminders
            </h3>
            <p className="text-[13px] text-slate-500 mt-0.5">
              Get notified to preserve Stomach Qi and maintain healthy sleep
            </p>
          </div>
        </div>

        {/* Master Toggle */}
        <div className="flex items-center justify-between mb-6 pb-6 border-b border-slate-100">
          <div className="flex-1">
            <Label htmlFor="sleep-cultivation-enabled" className="text-[15px] font-medium text-slate-900 cursor-pointer">
              Enable Sleep Cultivation Reminders
            </Label>
            <p className="text-[12px] text-slate-500 mt-1">
              Receive daily reminders based on TCM sleep cultivation principles
            </p>
          </div>
          <Switch
            id="sleep-cultivation-enabled"
            checked={preferences.sleep_cultivation_enabled}
            onCheckedChange={(checked) =>
              setPreferences(prev => ({ ...prev, sleep_cultivation_enabled: checked }))
            }
          />
        </div>

        {preferences.sleep_cultivation_enabled && (
          <div className="space-y-6">
            {/* Sleep Time */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <Moon className="w-4 h-4 text-slate-600" />
                <Label htmlFor="sleep-time" className="text-[14px] font-medium text-slate-900">
                  Sleep Time
                </Label>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <input
                    id="sleep-time"
                    type="time"
                    value={preferences.sleep_time}
                    onChange={(e) => handleTimeChange('sleep', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-[12px] border border-slate-200 bg-white text-[14px] text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="sleep-reminder-enabled"
                    checked={preferences.sleep_reminder_enabled}
                    onCheckedChange={(checked) =>
                      setPreferences(prev => ({ ...prev, sleep_reminder_enabled: checked }))
                    }
                  />
                  <Label htmlFor="sleep-reminder-enabled" className="text-[13px] text-slate-600 cursor-pointer">
                    Remind me
                  </Label>
                </div>
              </div>
              <p className="text-[12px] text-slate-500 flex items-start gap-1.5">
                <Info className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                <span>
                  According to TCM, the Heart (11 PM - 1 AM) and Liver (1 AM - 3 AM) are most active during deep sleep. 
                  Sleeping between 10-11 PM aligns with the organ clock.
                </span>
              </p>
            </div>

            {/* Dinner Cutoff Time */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <UtensilsCrossed className="w-4 h-4 text-slate-600" />
                <Label htmlFor="dinner-time" className="text-[14px] font-medium text-slate-900">
                  Dinner Cutoff Time
                </Label>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <input
                    id="dinner-time"
                    type="time"
                    value={preferences.dinner_cutoff_time}
                    onChange={(e) => handleTimeChange('dinner', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-[12px] border border-slate-200 bg-white text-[14px] text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="dinner-reminder-enabled"
                    checked={preferences.dinner_reminder_enabled}
                    onCheckedChange={(checked) =>
                      setPreferences(prev => ({ ...prev, dinner_reminder_enabled: checked }))
                    }
                  />
                  <Label htmlFor="dinner-reminder-enabled" className="text-[13px] text-slate-600 cursor-pointer">
                    Remind me
                  </Label>
                </div>
              </div>
              <p className="text-[12px] text-slate-500 flex items-start gap-1.5">
                <Info className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>TCM Principle:</strong> Digestion consumes Stomach Qi (胃气). 
                  Stop eating 3 hours before sleep to allow Stomach Qi to complete its work. 
                  When Stomach is not at peace, Heart cannot rest (胃不和则卧不安).
                </span>
              </p>
            </div>

            {/* Save Button */}
            <Button
              onClick={savePreferences}
              disabled={saving}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-[12px] py-2.5 text-[14px] font-medium transition-colors"
            >
              {saving ? (
                <>
                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Bell className="w-4 h-4 mr-2" />
                  Save Reminders
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}

