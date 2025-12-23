'use client'

import { InquiryStep } from '@/components/diagnosis/InquiryStep'
import { BasicInfoData } from '@/components/diagnosis/BasicInfoForm'

export default function TestInquiryPage() {
    // Mocked basic information data
    const mockBasicInfo: BasicInfoData = {
        name: 'John Doe',
        age: '35',
        gender: 'male',
        weight: '70',
        height: '175',
        symptoms: 'headache and fatigue',
        symptomDuration: '2 weeks',
        mainComplaint: 'Headache',
        otherSymptoms: 'Fatigue, Dizziness'
    }

    const handleComplete = (data: any) => {
        console.log('Inquiry completed with data:', data)
        alert('Inquiry completed! Check console for details.')
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 p-8">
            <div className="max-w-4xl mx-auto">
                <div className="mb-6 bg-white p-4 rounded-lg shadow-sm">
                    <h1 className="text-2xl font-bold text-emerald-800 mb-2">Test: Inquiry Step with Mocked Data</h1>
                    <p className="text-sm text-stone-600">
                        This page demonstrates the interactive chatroom between patient and AI doctor.
                    </p>
                    <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200 text-sm">
                        <strong>Mocked Patient Data:</strong>
                        <ul className="mt-1 space-y-1 text-stone-700">
                            <li>• Name: {mockBasicInfo.name}</li>
                            <li>• Age: {mockBasicInfo.age} years</li>
                            <li>• Gender: {mockBasicInfo.gender}</li>
                            <li>• Weight: {mockBasicInfo.weight} kg</li>
                            <li>• Height: {mockBasicInfo.height} cm</li>
                            <li>• Symptoms: {mockBasicInfo.symptoms}</li>
                            <li>• Duration: {mockBasicInfo.symptomDuration}</li>
                        </ul>
                    </div>
                </div>

                <InquiryStep
                    basicInfo={mockBasicInfo}
                    onComplete={handleComplete}
                />
            </div>
        </div>
    )
}
