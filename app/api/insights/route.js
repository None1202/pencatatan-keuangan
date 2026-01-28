import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req) {
    try {
        const { transactions } = await req.json();

        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json({ error: "Gemini API Key is missing" }, { status: 500 });
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const systemPrompt = `
      Anda adalah penasihat keuangan yang bijak. Analisis riwayat transaksi berikut dan berikan 3 wawasan atau rekomendasi keuangan yang singkat, dapat ditindaklanjuti, dan ramah.
      Fokus pada kebiasaan belanja, potensi penghematan, atau pujian untuk perilaku atau pencatatan yang baik.
      Gunakan Bahasa Indonesia.
      JANGAN gunakan format markdown seperti bintang (*), bold (**), atau bullet points simbol. Gunakan format paragraf biasa atau penomoran angka sederhana (1., 2., 3.).
      
      Transaksi:
      ${JSON.stringify(transactions)}
    `;

        const result = await model.generateContent(systemPrompt);
        const response = await result.response;
        const text = response.text();

        return NextResponse.json({ insights: text });
    } catch (error) {
        console.error("AI Insights Error:", error);
        return NextResponse.json({ error: "Failed to generate insights" }, { status: 500 });
    }
}
