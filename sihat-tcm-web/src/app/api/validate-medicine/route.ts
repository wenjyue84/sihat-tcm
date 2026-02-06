import { generateText } from "ai";
import { getGoogleProvider } from "@/lib/googleProvider";
import { devLog } from "@/lib/systemLogger";
import { createErrorResponse } from "@/lib/api/middleware/error-handler";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { text, language = "en" } = await req.json();

    if (!text) {
      return Response.json({ error: "Text is required" }, { status: 400 });
    }

    const prompt = `
        You are a medical assistant. Evaluate the following text: "${text}"
        
        Determine if this text represents:
        1. A valid medicine name (Western, TCM, or common brand names like 'Panadol', 'Tylenol', etc).
        2. A list of valid medicines.
        3. A description of medicines.
        
        Respond with a JSON object strictly in the following format:
        {
            "isValid": boolean,
            "message": "string"
        }

        Rules:
        1. Set "isValid" to true if the text IS LIKELY a medicine name, brand name (e.g. Panadol is Paracetamol), or describes medication. Be slightly more lenient - if it resembles a medicine name, accept it.
        2. Set "isValid" to false ONLY if the text is clearly NOT related to medicine (e.g. "grocery list", "random gibberish", "furniture", "hello").
        3. The "message" should be in the user's language (${language}).
        4. If invalid, the message should politely ask the user to input valid medicine information.
        5. Do not include markdown formatting like \`\`\`json. Just the raw JSON string.
        `;

    const google = getGoogleProvider();
    const { text: responseText } = await generateText({
      model: google("gemini-2.0-flash"),
      messages: [{ role: "user", content: prompt }],
    });

    // Clean up the response in case it contains markdown
    const cleanText = responseText
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();
    const result = JSON.parse(cleanText);

    return Response.json(result);
  } catch (error: unknown) {
    const errorResponse = createErrorResponse(error, "API/validate-medicine");
    const errorBody = await errorResponse.json();
    return Response.json(errorBody, { status: errorResponse.status });
  }
}
