-- Add sleep cultivation reminder preferences to user_notification_preferences
-- This extends the existing notification preferences table with sleep-specific settings

ALTER TABLE user_notification_preferences
ADD COLUMN IF NOT EXISTS sleep_cultivation_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS sleep_time TIME DEFAULT '22:00:00',
ADD COLUMN IF NOT EXISTS dinner_cutoff_time TIME DEFAULT '19:00:00',
ADD COLUMN IF NOT EXISTS sleep_reminder_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS dinner_reminder_enabled BOOLEAN DEFAULT true;

-- Add comment explaining the fields
COMMENT ON COLUMN user_notification_preferences.sleep_cultivation_enabled IS 'Master toggle for sleep cultivation reminders';
COMMENT ON COLUMN user_notification_preferences.sleep_time IS 'Target sleep time (when user should go to bed)';
COMMENT ON COLUMN user_notification_preferences.dinner_cutoff_time IS 'Time to stop eating (3 hours before sleep, preserves Stomach Qi)';
COMMENT ON COLUMN user_notification_preferences.sleep_reminder_enabled IS 'Enable push notification at sleep time';
COMMENT ON COLUMN user_notification_preferences.dinner_reminder_enabled IS 'Enable push notification at dinner cutoff time';


