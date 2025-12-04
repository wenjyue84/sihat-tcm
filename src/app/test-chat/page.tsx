'use client'

import { AdaptiveChat } from '@/components/diagnosis/AdaptiveChat'

export default function TestChatPage() {
    const basicInfo = {
        name: 'Test User',
        age: 30,
        gender: 'Male',
        symptoms: 'Headache'
    }

    return (
        <div className="p-10">
            <h1 className="text-2xl mb-4">Test Chat</h1>
            <AdaptiveChat
                basicInfo={basicInfo}
                onComplete={(data) => console.log('Complete:', data)}
            />
        </div>
    )
}
