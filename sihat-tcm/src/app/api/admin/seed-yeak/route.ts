import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Service Role Key for Admin Access (Bypasses RLS)
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpeHFtcXV3cXp2Y3ZkdmZuZmFyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDI2MDU1NywiZXhwIjoyMDQ5ODM2NTU3fQ.Jdnp7KTlQa2KVGmNkLRBEhtJPQ5jvQPxGxKaBZM0bSw';
const PROJECT_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kixqmquwqzvcvdvfnfar.supabase.co';

export async function GET() {
    try {
        const supabase = createClient(PROJECT_URL, SERVICE_KEY, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });

        // 1. Get User
        const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();

        if (userError) {
            return NextResponse.json({ error: 'Failed to list users', details: userError }, { status: 500 });
        }

        const user = users.find(u => u.email === 'yeak@gmail.com');
        if (!user) {
            return NextResponse.json({ error: 'User yeak@gmail.com not found. Please create it first.' }, { status: 404 });
        }

        // 2. Upsert Profile
        const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
                id: user.id,
                role: 'patient',
                full_name: 'Yeak Kiew Ai',
                age: 78,
                gender: 'female',
                height: 155,
                weight: 64,
                medical_history: 'Chronic Kidney Disease Stage 4, Hypertension, Cardiovascular disease, Hiatal hernia, Gastritis, Fatty liver, Pre-diabetes, Osteopenia, Avascular necrosis, Sciatica, Anxiety and insomnia, Hearing loss (45%)',
                preferred_language: 'en'
            });

        if (profileError) {
            return NextResponse.json({ error: 'Failed to update profile', details: profileError }, { status: 500 });
        }

        // 3. Insert Diagnosis Session
        const diagnosisData = {
            user_id: user.id,
            primary_diagnosis: 'Multiple Chronic Conditions - CKD Stage 4, Cardiovascular, Gastrointestinal',
            constitution: 'Kidney Yin Deficiency with Damp-Heat accumulation',
            overall_score: 45,
            symptoms: [
                'Chronic kidney disease symptoms', 'Fluid retention', 'Elevated creatinine', 'Decreased eGFR',
                'Stomach bloating', 'Food blockage sensation', 'Gastritis symptoms', 'Hiatal hernia',
                'Difficulty swallowing solid foods', 'Right hip pain', 'Bilateral knee arthritis',
                'Lower back pain', 'Osteopenia', 'Hypertension', 'Heart condition requiring surgery',
                'Sciatica', 'Neuropathic pain', 'Hand tremors', 'Pre-diabetes', 'High triglycerides',
                'Low HDL cholesterol', 'Anxiety', 'Insomnia', 'Hearing loss 45%'
            ],
            medicines: [
                'Valsartan/Amlodipine combination', 'Atenolol', 'Rabeprazole', 'Duloxetine',
                'Mirtazapine', 'Lexoton/Bromazepam', 'Joint supplements', 'Paracetamol'
            ],
            vital_signs: {
                weight_kg: 64,
                weight_trend: 'increased from 48-54kg range - possible fluid retention',
                kidney_function: { eGFR: '27 mL/min/1.73m²', creatinine: '167 µmol/L', bun: '8.1 mmol/L', stage: 'CKD Stage 4' },
                metabolic_panel: { hba1c: '6.0%', triglycerides: '2.97 mmol/L', hdl: '1.12 mmol/L' },
                bone_density: { left_hip: 'osteopenia' }
            },
            clinical_notes: `# Medical Summary - Yeak Kiew Ai\n\n## Critical Conditions\n- **CKD Stage 4**: eGFR 27. STRICTLY NO NSAIDs.\n- **Gastrointestinal**: Hiatal hernia, gastritis. SOFT FOODS ONLY.\n- **Cardiovascular**: Hypertension, history of heart infection.\n- **Musculoskeletal**: Hip/knee arthritis, osteopenia.\n\n## Recent Progress (Dec 10-11, 2025)\n- Interventions by Jay: Stopped problematic meds, strict diet (thin porridge), warm environment.\n- Result: Hand tremors RESOLVED, mood improved, bloating reduced.\n\n## Care Protocol\n- Diet: Thin rice congee + steamed egg.\n- Avoid: Sweet potato (high potassium), bread, cauliflower.\n- Env: No prolonged AC.`,
            treatment_plan: `DIET: Soft foods only. Low potassium. No sweet potato/bread.\nMEDS: No NSAIDs. Paracetamol only for pain.\nENV: Keep warm.`,
            follow_up_date: '2025-12-11',
            full_report: {
                status: 'STABLE & IMPROVING',
                recent_improvements: ['Hand tremors resolved', 'Bloating reduced', 'Mood improved'],
                care_team: ['Jay (Primary)', 'Niko', 'Bin']
            },
            notes: 'Imported via Admin API. Patient showing significant improvement after strict dietary control Dec 2025.',
            created_at: new Date('2025-12-11').toISOString()
        };

        const { error: diagnosisError } = await supabase
            .from('diagnosis_sessions')
            .insert(diagnosisData);

        if (diagnosisError) {
            return NextResponse.json({ error: 'Failed to insert diagnosis', details: diagnosisError }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: 'Data populated successfully for Yeak Kiew Ai',
            user: { email: user.email, id: user.id },
            data: diagnosisData
        });

    } catch (err: any) {
        return NextResponse.json({ error: 'Internal Server Error', message: err.message }, { status: 500 });
    }
}
