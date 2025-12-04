'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useState } from 'react'

export interface BasicInfoData {
    name: string
    age: string
    gender: string
    symptoms: string
}

export function BasicInfoForm({ onComplete }: { onComplete: (data: BasicInfoData) => void }) {
    const [formData, setFormData] = useState<BasicInfoData>({
        name: '',
        age: '',
        gender: '',
        symptoms: ''
    })

    const commonSymptoms = [
        "Fever", "Cough", "Headache", "Fatigue",
        "Stomach Pain", "Sore Throat", "Shortness of Breath"
    ]

    const handleSymptomClick = (symptom: string) => {
        const currentSymptoms = formData.symptoms
        const newSymptoms = currentSymptoms
            ? `${currentSymptoms}, ${symptom}`
            : symptom
        setFormData({ ...formData, symptoms: newSymptoms })
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (formData.name && formData.age && formData.gender) {
            onComplete(formData)
        }
    }

    return (
        <Card className="p-6 space-y-4">
            <h2 className="text-xl font-semibold">Basic Information</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Enter your name"
                        required
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="age">Age</Label>
                        <Input
                            id="age"
                            type="number"
                            value={formData.age}
                            onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                            placeholder="Age"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="gender">Gender</Label>
                        <select
                            id="gender"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={formData.gender}
                            onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                            required
                        >
                            <option value="">Select Gender</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>Common Symptoms</Label>
                    <div className="flex flex-wrap gap-2">
                        {commonSymptoms.map((symptom) => (
                            <Button
                                key={symptom}
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleSymptomClick(symptom)}
                            >
                                {symptom}
                            </Button>
                        ))}
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="symptoms">General Symptoms / Concerns</Label>
                    <Textarea
                        id="symptoms"
                        value={formData.symptoms}
                        onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
                        placeholder="Briefly describe your main complaints..."
                    />
                </div>

                <Button type="submit" className="w-full">Start Diagnosis</Button>
            </form>
        </Card>
    )
}
