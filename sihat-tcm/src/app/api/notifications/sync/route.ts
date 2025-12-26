import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { deviceToken, syncData } = body

    if (!deviceToken) {
      return NextResponse.json(
        { error: 'Device token is required' },
        { status: 400 }
      )
    }

    // Update device last seen
    await supabase.rpc('update_device_last_seen', {
      p_device_token: deviceToken,
      p_user_id: user.id
    })

    // Get user's notification preferences
    const { data: preferences } = await supabase
      .from('user_notification_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single()

    // Get user's active devices
    const { data: devices } = await supabase
      .from('user_devices')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)

    // Get pending notifications
    const { data: pendingNotifications } = await supabase
      .rpc('get_pending_notifications', {
        p_user_id: user.id
      })

    // Get scheduled notifications
    const { data: scheduledNotifications } = await supabase
      .from('scheduled_notifications')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_sent', false)
      .eq('is_cancelled', false)
      .order('scheduled_for', { ascending: true })

    // Sync any local data if provided
    if (syncData) {
      // Handle local notification history sync
      if (syncData.notificationHistory && Array.isArray(syncData.notificationHistory)) {
        const historyToInsert = syncData.notificationHistory.map((item: any) => ({
          user_id: user.id,
          notification_type: item.type || 'unknown',
          title: item.title || '',
          body: item.body || '',
          data: item.data || {},
          category: item.category || 'general',
          priority: item.priority || 'normal',
          sent_at: item.sentAt || new Date().toISOString(),
          clicked: item.clicked || false,
          clicked_at: item.clickedAt || null,
          device_type: item.deviceType || 'mobile'
        }))

        if (historyToInsert.length > 0) {
          await supabase
            .from('notification_history')
            .insert(historyToInsert)
        }
      }

      // Handle local scheduled notifications sync
      if (syncData.scheduledNotifications && Array.isArray(syncData.scheduledNotifications)) {
        const notificationsToInsert = syncData.scheduledNotifications.map((item: any) => ({
          user_id: user.id,
          notification_type: item.type || 'unknown',
          title: item.title || '',
          body: item.body || '',
          data: item.data || {},
          scheduled_for: item.scheduledFor || new Date().toISOString(),
          repeat_pattern: item.repeatPattern || null,
          repeat_config: item.repeatConfig || null,
          category: item.category || 'general',
          priority: item.priority || 'normal'
        }))

        if (notificationsToInsert.length > 0) {
          await supabase
            .from('scheduled_notifications')
            .insert(notificationsToInsert)
        }
      }
    }

    return NextResponse.json({
      success: true,
      syncData: {
        preferences,
        devices,
        pendingNotifications,
        scheduledNotifications,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Notification sync error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get comprehensive sync data
    const [preferencesResult, devicesResult, pendingResult, scheduledResult, historyResult] = await Promise.all([
      supabase
        .from('user_notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single(),
      
      supabase
        .from('user_devices')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true),
      
      supabase.rpc('get_pending_notifications', {
        p_user_id: user.id
      }),
      
      supabase
        .from('scheduled_notifications')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_sent', false)
        .eq('is_cancelled', false)
        .order('scheduled_for', { ascending: true }),
      
      supabase
        .from('notification_history')
        .select('*')
        .eq('user_id', user.id)
        .order('sent_at', { ascending: false })
        .limit(100)
    ])

    return NextResponse.json({
      success: true,
      syncData: {
        preferences: preferencesResult.data,
        devices: devicesResult.data || [],
        pendingNotifications: pendingResult.data || [],
        scheduledNotifications: scheduledResult.data || [],
        notificationHistory: historyResult.data || [],
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Notification sync fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}