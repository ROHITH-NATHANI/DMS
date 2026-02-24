import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const geminiModel = "gemini-3-flash-preview";

export async function getEmergencyInstructions(disasterType: string, location: string) {
  const response = await ai.models.generateContent({
    model: geminiModel,
    contents: `Provide immediate, concise emergency instructions for a ${disasterType} at ${location}. Include 3-5 critical steps.`,
    config: {
      systemInstruction: "You are a disaster response expert. Provide life-saving advice in a calm, clear, and urgent tone.",
    },
  });
  return response.text;
}

export async function analyzeDamage(imageBase64: string) {
  const response = await ai.models.generateContent({
    model: geminiModel,
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: imageBase64.split(",")[1],
          },
        },
        {
          text: "Analyze this disaster damage image. Identify the type of damage, estimate severity (Low, Medium, High, Critical), and suggest immediate safety actions. Return in JSON format.",
        },
      ],
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          damageType: { type: Type.STRING },
          severity: { type: Type.STRING },
          description: { type: Type.STRING },
          safetyActions: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
        },
        required: ["damageType", "severity", "description", "safetyActions"],
      },
    },
  });
  return JSON.parse(response.text || "{}");
}

export async function getPsychologicalSupport(message: string) {
  const response = await ai.models.generateContent({
    model: geminiModel,
    contents: message,
    config: {
      systemInstruction: "You are a crisis counselor providing psychological first aid to disaster survivors. Be empathetic, validating, and provide grounding techniques. If the user is in immediate physical danger, tell them to use the SOS button.",
    },
  });
  return response.text;
}

export async function getRiskAlerts(lat: number, lng: number) {
  // In a real app, this would fetch real weather data and then use Gemini to interpret it.
  // For this demo, we'll simulate the grounding.
  const response = await ai.models.generateContent({
    model: geminiModel,
    contents: `What are the current disaster risks for coordinates ${lat}, ${lng}? Use Google Search to find real-time weather alerts or disaster warnings in that area.`,
    config: {
      tools: [{ googleSearch: {} }],
    },
  });
  return response.text;
}
