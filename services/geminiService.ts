import { GoogleGenAI } from "@google/genai";

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function analyzeFacialExpression(base64Image: string): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Image,
            },
          },
          {
            text: 'Analyze the facial expression in this image. Respond with ONLY one of the following words based on the dominant emotion: "Happy", "Sad", "Stressed", "Angry", "Neutral", "Tired".',
          },
        ],
      },
    });
    return response.text.trim().replace(/["'.]/g, '');
  } catch (error) {
    console.error("Error analyzing facial expression:", error);
    throw new Error("Failed to analyze expression. Please try again.");
  }
}

export async function getChatbotResponse(message: string, emotion: string): Promise<string> {
    try {
      const prompt = `You are Tessa, a caring and empathetic AI therapist, and knowledgable. A user is talking to you, and their current emotional state appears to be "${emotion}".
      Please provide a supportive, helpful, and concise response to their message. Keep your tone gentle and encouraging.
      User's message: "${message}"`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
      return response.text.trim();
    } catch (error) {
      console.error("Error generating chatbot response:", error);
      throw new Error("Failed to get a response. Please try again.");
    }
  }
