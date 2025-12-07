'use client'

import { useState } from 'react'
import { DiagnosisReport } from '@/components/diagnosis/DiagnosisReport'

export default function TestReportPage() {
    const [key, setKey] = useState(0)

    const handleRestart = () => {
        setKey(prev => prev + 1)
    }

    const dummyPatientInfo = {
        name: 'John Doe',
        age: 35,
        gender: 'Male',
        height: 175,
        weight: 70,
        symptoms: 'Feeling tired and having trouble sleeping.',
        contact: '123-456-7890',
        address: '123 TCM Street, Healing City',
        emergencyContact: 'Jane Doe (Sister) - 987-654-3210'
    }

    const dummyReportData = {
        diagnosis: {
            primary_pattern: 'Liver Qi Stagnation',
            secondary_patterns: ['Spleen Qi Deficiency'],
            affected_organs: ['Liver', 'Spleen'],
            pathomechanism: 'Stress causing Liver Qi to stagnate, affecting Spleen function.'
        },
        constitution: {
            type: 'Qi Stagnation',
            description: 'Tendency towards mood swings and digestive issues.'
        },
        analysis: {
            summary: 'The patient shows signs of stress affecting digestion.',
            key_findings: {
                from_inquiry: 'Reports high stress and bloating.',
                from_visual: 'Tongue is slightly purple on the sides.',
                from_pulse: 'Pulse is wiry.'
            },
            pattern_rationale: 'Wiry pulse and purple tongue sides indicate Liver Qi Stagnation.'
        },
        recommendations: {
            food: ['Green leafy vegetables', 'Citrus fruits'],
            avoid: ['Spicy foods', 'Alcohol'],
            lifestyle: ['Regular exercise', 'Meditation'],
            food_therapy: {
                beneficial: ['Peppermint tea', 'Rose tea'],
                recipes: ['Stir-fried greens with garlic'],
                avoid: ['Deep fried foods']
            },
            acupoints: ['LV3 (Taichong)', 'LI4 (Hegu)'],
            exercise: ['Tai Chi', 'Yoga'],
            sleep_guidance: 'Sleep before 11 PM.',
            emotional_care: 'Practice mindfulness.',
            herbal_formulas: [
                {
                    name: 'Xiao Yao San',
                    ingredients: ['Bupleurum', 'Peony', 'Angelica'],
                    dosage: 'Take twice daily.',
                    purpose: 'Soothe Liver Qi and nourish Blood.'
                }
            ],
            doctor_consultation: 'Recommended to see a specialist for acupuncture.',
            general: ['Keep warm', 'Drink warm water']
        },
        patient_summary: {
            name: 'John Doe',
            age: 35,
            gender: 'Male',
            vital_signs: {
                bmi: 22.9,
                blood_pressure: '120/80',
                heart_rate: 72,
                temperature: 36.5
            }
        },
        precautions: {
            warning_signs: ['Severe abdominal pain', 'High fever'],
            contraindications: ['Avoid heavy lifting'],
            special_notes: 'Monitor stress levels.'
        },
        follow_up: {
            timeline: '2 weeks',
            expected_improvement: 'Better sleep and digestion.',
            next_steps: 'Return for pulse check.'
        },
        disclaimer: 'This is a dummy report for testing purposes.',
        timestamp: new Date().toISOString()
    }

    const dummySmartConnectData = {
        pulseRate: 75,
        bloodPressure: '118/78',
        bloodOxygen: 98,
        bodyTemp: 36.6,
        hrv: 55,
        stressLevel: 'Moderate'
    }

    const reportOptions = {
        includePatientName: true,
        includePatientAge: true,
        includePatientGender: true,
        includePatientContact: true,
        includePatientAddress: true,
        includeEmergencyContact: true,
        includeVitalSigns: true,
        includeBMI: true,
        includeSmartConnectData: true,
        suggestMedicine: true,
        suggestDoctor: true,
        includeDietary: true,
        includeLifestyle: true,
        includeAcupuncture: true,
        includeExercise: true,
        includeSleepAdvice: true,
        includeEmotionalWellness: true,
        includePrecautions: true,
        includeFollowUp: true,
        includeTimestamp: true,
        includeQRCode: true,
        includeDoctorSignature: true
    }

    return (
        <div className="min-h-screen bg-stone-50 p-4 md:p-8">
            <div className="max-w-4xl mx-auto mb-8">
                <h1 className="text-2xl font-bold text-stone-800 mb-2">Diagnosis Report Test Page</h1>
                <p className="text-stone-600">
                    This page renders the DiagnosisReport component with dummy data to test the layout and functionality, specifically the split-view chat.
                </p>
            </div>

            <DiagnosisReport
                key={key}
                data={dummyReportData}
                patientInfo={dummyPatientInfo}
                reportOptions={reportOptions}
                smartConnectData={dummySmartConnectData}
                onRestart={handleRestart}
                saved={false}
            />
        </div>
    )
}
