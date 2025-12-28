import { NextRequest, NextResponse } from "next/server";
import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";

const questionsSchema = z.object({
    questions: z.array(z.object({
        id: z.string(),
        question: z.string(),
        choices: z.array(z.object({
            id: z.string(),
            label: z.string(),
        })),
        multiSelect: z.boolean(),
    })),
});

export async function POST(req: NextRequest) {
    try {
        const { patientInfo, symptoms } = await req.json();

        const prompt = `You are a Traditional Chinese Medicine (TCM) practitioner conducting a diagnostic inquiry (问诊).

Based on the following patient information:
- Age: ${patientInfo.age || "Unknown"}
- Gender: ${patientInfo.gender || "Unknown"}
- Height: ${patientInfo.height ? `${patientInfo.height} cm` : "Unknown"}
- Weight: ${patientInfo.weight ? `${patientInfo.weight} kg` : "Unknown"}
- Chief Complaints/Symptoms: ${symptoms || "None provided"}

Generate 6-8 relevant TCM diagnostic questions with multiple choice answers. The questions should help identify:
1. Pattern differentiation (寒热虚实)
2. Organ system involvement
3. Constitutional factors
4. Lifestyle and emotional factors

For each question:
- Make it clear and concise
- Provide 3-5 relevant answer choices
- Set multiSelect to true if multiple answers can apply
- Use simple, patient-friendly language

Focus on questions that would help differentiate TCM patterns based on the presenting symptoms.`;

        const result = await generateObject({
            model: google("gemini-2.0-flash"),
            schema: questionsSchema,
            prompt,
        });

        return NextResponse.json(result.object);
    } catch (error) {
        console.error("Error generating inquiry questions:", error);

        // Return fallback questions
        return NextResponse.json({
            questions: [
                {
                    id: "q1",
                    question: "How is your appetite recently?",
                    choices: [
                        { id: "good", label: "Good" },
                        { id: "poor", label: "Poor" },
                        { id: "excessive", label: "Excessive" },
                        { id: "variable", label: "Variable" },
                    ],
                    multiSelect: false,
                },
                {
                    id: "q2",
                    question: "How is your sleep quality?",
                    choices: [
                        { id: "good", label: "Good" },
                        { id: "difficulty_falling", label: "Difficulty falling asleep" },
                        { id: "waking_up", label: "Waking up frequently" },
                        { id: "dreams", label: "Many dreams" },
                    ],
                    multiSelect: true,
                },
                {
                    id: "q3",
                    question: "How is your energy level throughout the day?",
                    choices: [
                        { id: "good", label: "Good" },
                        { id: "low", label: "Low" },
                        { id: "fluctuating", label: "Fluctuating" },
                        { id: "exhausted", label: "Exhausted" },
                    ],
                    multiSelect: false,
                },
                {
                    id: "q4",
                    question: "Any emotional concerns?",
                    choices: [
                        { id: "none", label: "None" },
                        { id: "stress", label: "Stress" },
                        { id: "anxiety", label: "Anxiety" },
                        { id: "irritability", label: "Irritability" },
                    ],
                    multiSelect: true,
                },
                {
                    id: "q5",
                    question: "How is your digestion?",
                    choices: [
                        { id: "normal", label: "Normal" },
                        { id: "bloating", label: "Bloating" },
                        { id: "constipation", label: "Constipation" },
                        { id: "diarrhea", label: "Diarrhea" },
                    ],
                    multiSelect: true,
                },
                {
                    id: "q6",
                    question: "Do you tend to feel hot or cold?",
                    choices: [
                        { id: "normal", label: "Normal" },
                        { id: "cold", label: "Always feel cold" },
                        { id: "hot", label: "Always feel hot" },
                        { id: "mixed", label: "Cold hands/feet, hot upper body" },
                    ],
                    multiSelect: false,
                },
            ],
        });
    }
}
