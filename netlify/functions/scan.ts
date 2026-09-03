import type { Config, Context } from "@netlify/functions";
import { GoogleGenAI, Type } from "@google/genai";

export default async (req: Request, context: Context) => {
  // CORS Headers
  const headers = {
    "Access-Control-Allow-Origin": "*", // Or specific production origin
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...headers, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const { image, mimeType } = body;

    if (!image || !mimeType) {
      return new Response(JSON.stringify({ error: "Image data and mimeType are required" }), {
        status: 400,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      return new Response(JSON.stringify({ error: "Gemini API key is not configured on the server." }), {
        status: 503,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview", // Pro for better logical accuracy in structured output
      contents: {
        parts: [
          {
            inlineData: {
              mimeType,
              data: image,
            },
          },
          {
            text: "Analyze this image and extract the mathematical matrix. Support integers, decimals, fractions, and negative signs. Return structured JSON.",
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            rows: { type: Type.INTEGER, description: "Number of rows" },
            columns: { type: Type.INTEGER, description: "Number of columns" },
            matrix: {
              type: Type.ARRAY,
              description: "The matrix data as a 2D array of numbers",
              items: {
                type: Type.ARRAY,
                items: { type: Type.NUMBER },
              },
            },
            confidence: { type: Type.NUMBER, description: "Confidence level from 0 to 1" },
            notes: { type: Type.STRING, description: "Any notes or warnings" },
          },
          required: ["rows", "columns", "matrix", "confidence"],
        },
      },
    });

    return new Response(response.text, {
      status: 200,
      headers: { ...headers, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Scan Error:", error);
    return new Response(JSON.stringify({ error: error.message || "Failed to scan matrix" }), {
      status: 500,
      headers: { ...headers, "Content-Type": "application/json" },
    });
  }
};

export const config: Config = {
  path: "/api/scan",
};
