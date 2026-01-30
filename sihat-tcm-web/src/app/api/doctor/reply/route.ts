
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const { requestId, message, status, targetTable } = await req.json();

        if (!requestId || !message) {
            return NextResponse.json(
                { error: "Request ID and message are required" },
                { status: 400 }
            );
        }

        // Create Supabase client with service role for admin access (bypasses RLS)
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false,
                },
            }
        );

        const table = targetTable === 'inquiries' ? 'inquiries' : 'diagnosis_sessions';
        const reportColumn = table === 'inquiries' ? 'diagnosis_report' : 'full_report';

        // 1. Fetch current data
        const { data: currentRecord, error: fetchError } = await supabaseAdmin
            .from(table)
            .select(`id, ${reportColumn}`)
            .eq("id", requestId)
            .single();

        if (fetchError || !currentRecord) {
            console.error(`Error fetching record from ${table}:`, fetchError);
            return NextResponse.json(
                { error: "Record not found" },
                { status: 404 }
            );
        }

        const currentReport = (currentRecord as any)[reportColumn] || {};
        const currentMessages = currentReport.messages || [];

        // 2. Append new message
        const newMsg = {
            role: "doctor",
            content: message,
            timestamp: new Date().toISOString(),
        };

        const updatedReport = {
            ...currentReport,
            messages: [...currentMessages, newMsg],
            status: status || "active", // Activation behavior
        };

        // 3. Update record
        const { error: updateError } = await supabaseAdmin
            .from(table)
            .update({
                [reportColumn]: updatedReport
            })
            .eq("id", requestId);

        if (updateError) {
            console.error(`Error updating ${table}:`, updateError);
            return NextResponse.json(
                { error: updateError.message },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            data: updatedReport
        });

    } catch (error: unknown) {
        console.error("Doctor reply error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
