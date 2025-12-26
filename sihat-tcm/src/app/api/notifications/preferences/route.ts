import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user notification preferences
    const { data, error } = await supabase
      .from('user_notification_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Preferences fetch error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch preferences' },
        { status: 500 }
      )
    }

    // Return default preferences if none exist
    if (!data) {
      const defaultPreferences = {
        enabled: true,
        health_reminders: true,
        medication_alerts: true,
        appointment_reminders: true,
        exercise_reminders: true,
        sleep_reminders: true,
        quiet_hours_enabled: true,
        quiet_hours_start: '22:00:00',
        quiet_hours_end: '07:00:00',
        frequency_daily: true,
        frequency_weekly: true,
        frequency_monthly: false,
        categories: {
          health: true,
          medication: true,
          exercise: true,
          diet: true,
          sleep: true,
          appointments: true
        }
      }

      return NextResponse.json({
        success: true,
        preferences: defaultPreferences
      })
    }

    return NextResponse.json({
      success: true,
      preferences: data
    })

  } catch (error) {
    console.error('Preferences fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      enabled,
      health_reminders,
      medication_alerts,
      appointment_reminders,
      exercise_reminders,
      sleep_reminders,
      quiet_hours_enabled,
      quiet_hours_start,
      quiet_hours_end,
      frequency_daily,
      frequency_weekly,
      frequency_monthly,
      categories
    } = body

    // Upsert user notification preferences
    const { data, error } = await supabase
      .from('user_notification_preferences')
      .upsert({
        user_id: user.id,
        enabled,
        health_reminders,
        medication_alerts,
        appointment_reminders,
        exercise_reminders,
        sleep_reminders,
        quiet_hours_enabled,
        quiet_hours_start,
        quiet_hours_end,
        frequency_daily,
        frequency_weekly,
        frequency_monthly,
        categories
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single()

    if (error) {
      console.error('Preferences update error:', error)
      return NextResponse.json(
        { error: 'Failed to update preferences' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      preferences: data
    })

  } catch (error) {
    console.error('Preferences update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}