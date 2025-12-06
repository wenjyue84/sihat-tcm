'use client'

import { DiagnosisReport } from '@/components/diagnosis/DiagnosisReport'
import { DoctorProvider } from '@/contexts/DoctorContext'

const mockData = {
    diagnosis: "Qi Deficiency",
    constitution: "Qi Deficient Type",
    analysis: "Your pulse indicates a lack of vital energy. You may feel tired easily and have shortness of breath.",
    recommendations: {
        food: ["Ginseng", "Chicken Soup", "Yam"],
        avoid: ["Cold drinks", "Raw vegetables"],
        lifestyle: ["Sleep early", "Light exercise"]
    }
}

export default function TestReportPage() {
    return (
        <DoctorProvider>
            <div className="p-8 bg-stone-50 min-h-screen">
                <h1 className="text-2xl font-bold mb-8 text-center">Diagnosis Report Component Test</h1>
                <DiagnosisReport
                    data={mockData}
                    onRestart={() => alert('Restart clicked')}
                />
            </div>
        </DoctorProvider>
    )
}
