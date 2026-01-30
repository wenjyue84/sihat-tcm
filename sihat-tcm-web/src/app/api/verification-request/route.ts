/**
 * API Route: Create Verification Request
 * 
 * Uses service role to bypass RLS for inserting verification requests
 */
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { userId, doctorId, doctorName, patientData, reportData } = body;

        // Validate required fields
        if (!doctorId || !doctorName) {
            return NextResponse.json(
                { error: "Doctor information is required" },
                { status: 400 }
            );
        }

        // Create Supabase client with service role for admin access
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

        // Create verification request in inquiries table
        const verificationData = {
            user_id: userId || null,
            symptoms: "Request for Verification",
            diagnosis_report: {
                type: "verification_request",
                status: "pending",
                messages: [],
                patient_profile: {
                    name: patientData?.name || "Anonymous",
                    email: patientData?.email || null,
                },
                ai_diagnosis: reportData?.diagnosis || null,
                selected_doctor: {
                    id: doctorId,
                    name: doctorName,
                },
                requested_at: new Date().toISOString(),
            },
        };

        const { data, error } = await supabaseAdmin
            .from("inquiries")
            .insert([verificationData])
            .select()
            .single();

        if (error) {
            console.error("Error creating verification request:", error);
            return NextResponse.json(
                { error: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            data: {
                id: data.id,
                doctor: doctorName,
                status: "pending",
            },
        });

    } catch (error: unknown) {
        console.error("Verification request error:", error);
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json(
            { error: message },
            { status: 500 }
        );
    }
}
