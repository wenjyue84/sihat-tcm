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
    const { deviceToken, deviceType, deviceName, platformInfo } = body;

    if (!deviceToken || !deviceType) {
      return NextResponse.json({ error: "Device token and type are required" }, { status: 400 });
    }

    // Register or update device
    const { data, error } = await supabase
      .from("user_devices")
      .upsert(
        {
          user_id: user.id,
          device_token: deviceToken,
          device_type: deviceType,
          device_name: deviceName,
          platform_info: platformInfo,
          is_active: true,
          last_seen: new Date().toISOString(),
        },
        {
          onConflict: "user_id,device_token",
        }
      )
      .select()
      .single();

    if (error) {
      console.error("Device registration error:", error);
      return NextResponse.json({ error: "Failed to register device" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      device: data,
    });
  } catch (error) {
    console.error("Device registration error:", error);
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
    const deviceToken = searchParams.get("deviceToken");

    if (!deviceToken) {
      return NextResponse.json({ error: "Device token is required" }, { status: 400 });
    }

    // Deactivate device
    const { error } = await supabase
      .from("user_devices")
      .update({ is_active: false })
      .eq("user_id", user.id)
      .eq("device_token", deviceToken);

    if (error) {
      console.error("Device deactivation error:", error);
      return NextResponse.json({ error: "Failed to deactivate device" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Device deactivation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
