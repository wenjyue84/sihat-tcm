import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      notification_type,
      title,
      body: notificationBody,
      data,
      scheduled_for,
      repeat_pattern,
      repeat_config,
      category,
      priority = "normal",
    } = body;

    if (!notification_type || !title || !notificationBody || !scheduled_for || !category) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Schedule notification
    const { data: scheduledNotification, error } = await supabase
      .from("scheduled_notifications")
      .insert({
        user_id: user.id,
        notification_type,
        title,
        body: notificationBody,
        data: data || {},
        scheduled_for,
        repeat_pattern,
        repeat_config,
        category,
        priority,
      })
      .select()
      .single();

    if (error) {
      console.error("Notification scheduling error:", error);
      return NextResponse.json({ error: "Failed to schedule notification" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      notification: scheduledNotification,
    });
  } catch (error) {
    console.error("Notification scheduling error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const pending = searchParams.get("pending") === "true";

    let query = supabase
      .from("scheduled_notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("scheduled_for", { ascending: true });

    if (pending) {
      query = query
        .eq("is_sent", false)
        .eq("is_cancelled", false)
        .lte("scheduled_for", new Date().toISOString());
    }

    const { data, error } = await query;

    if (error) {
      console.error("Notifications fetch error:", error);
      return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      notifications: data,
    });
  } catch (error) {
    console.error("Notifications fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const notificationId = searchParams.get("id");
    const type = searchParams.get("type");
    const reminderType = searchParams.get("reminder_type");

    let query = supabase
      .from("scheduled_notifications")
      .update({
        is_cancelled: true,
        cancelled_at: new Date().toISOString(),
      })
      .eq("user_id", user.id)
      .eq("is_cancelled", false);

    // Cancel by ID
    if (notificationId) {
      query = query.eq("id", notificationId);
    }
    // Cancel by type (e.g., all sleep_cultivation notifications)
    else if (type) {
      query = query.eq("notification_type", type);
      
      // Optionally filter by reminder_type within the data JSONB
      if (reminderType) {
        query = query.contains("data", { reminder_type: reminderType });
      }
    } else {
      return NextResponse.json({ error: "Notification ID or type is required" }, { status: 400 });
    }

    const { error } = await query;

    if (error) {
      console.error("Notification cancellation error:", error);
      return NextResponse.json({ error: "Failed to cancel notification" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Notification cancellation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
