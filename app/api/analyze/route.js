import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req) {
    try {
        const formData = await req.formData();
        const file = formData.get("file");
        const promptText = formData.get("prompt") || "Analyze this financial document and extract details.";

        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json({ error: "Gemini API Key is missing" }, { status: 500 });
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        // Use gemini-2.5-flash as requested.
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        let imagePart = null;
        if (file && file instanceof Blob) {
            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);
            imagePart = {
                inlineData: {
                    data: buffer.toString("base64"),
                    mimeType: file.type,
                },
            };
        }

        const systemPrompt = `
      You are an expert financial assistant AI. 
      Your task is to analyze the input (which may be a receipt image or text description) and extract structured financial data.
      
      Return ONLY a valid JSON object (no markdown formatting, no code fencing) with the following schema:
      {
        "merchant": "string (name of place/person)",
        "amount": number (numeric value only, no currency symbols),
        "date": "string (YYYY-MM-DD)",
        "category": "string (e.g., Food, Transport, Utilities, Entertainment, Salary, Business, Other)",
        "type": "string (Income or Expense)",
        "summary": "string (brief description of items/service)"
      }

      If the input is just a text prompt like "I spent 50k on coffee", parse it accurately.
      If it's an image, perform OCR and extraction.
      If data is missing, make a reasonable guess or use current date for date.
    `;

        const parts = [systemPrompt];
        if (imagePart) parts.push(imagePart);
        parts.push(promptText);

        const result = await model.generateContent(parts);
        const response = await result.response;
        const text = response.text();

        // Clean up markdown if model adds it
        const jsonString = text.replace(/```json/g, "").replace(/```/g, "").trim();
        const data = JSON.parse(jsonString);

        return NextResponse.json(data);
    } catch (error) {
        console.error("AI Analysis Error:", error);
        return NextResponse.json({ error: "Failed to analyze data" }, { status: 500 });
    }
}
