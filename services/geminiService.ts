
import { GoogleGenAI, Type } from "@google/genai";
import { EvaluationResult } from "../types";

const SYSTEM_INSTRUCTION = `
You are the Senior Editor for the American Occupational Therapy Association (AOTA) "Student Pulse" e-newsletter. 
Your goal is to mentor OT and OTA students to refine their articles for publication.
You must evaluate the student's draft against specific criteria:
1. Tone: Authentic, conversational, peer-to-peer.
2. Format: Bulleted/numbered lists, headings, no walls of text.
3. Structure: Strong thesis, supporting points.
4. Packaging: Catchy title.
5. Length: Max 750 words.
6. Admin: Must have signed copyright form.

If a GOOGLE DOC LINK is provided, use Google Search grounding to retrieve and read the content if possible. 
If you cannot access the link, evaluate based on the context provided but mention the access issue in Editor's Notes.

Critical Disclaimer: "Please note: Articles are not guaranteed to be published based on a pitch or a first draft."

Output MUST be JSON format matching the schema provided.
For Section 3 (Polished Draft), rewrite the article to meet the criteria. 
Fix flow, insert headings, use person-first language, and BOLD your edits using markdown **text**.
`;

export const evaluateArticle = async (draft: string, overrideApiKey?: string): Promise<EvaluationResult> => {
  // Use the provided key, or the environment variable
  const keyToUse = overrideApiKey || process.env.API_KEY || '';
  
  if (!keyToUse) {
    throw new Error("No API Key found. Please add it in Settings (top right).");
  }

  const ai = new GoogleGenAI({ apiKey: keyToUse });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `Evaluate this article draft for AOTA Student Pulse: \n\n ${draft}`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            scorecard: {
              type: Type.OBJECT,
              properties: {
                conversationalTone: { type: Type.BOOLEAN },
                scannability: { type: Type.BOOLEAN },
                creativeFormatting: { type: Type.BOOLEAN },
                wordCount: { type: Type.INTEGER },
                packaging: { type: Type.BOOLEAN },
                adminCheck: { type: Type.BOOLEAN }
              },
              required: ["conversationalTone", "scannability", "creativeFormatting", "wordCount", "packaging", "adminCheck"]
            },
            readinessRating: { 
              type: Type.STRING,
              description: "One of: Ready for Review, Needs Minor Polish, Needs Structural Rework"
            },
            editorNotes: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            polishedDraft: { type: Type.STRING }
          },
          required: ["scorecard", "readinessRating", "editorNotes", "polishedDraft"]
        }
      }
    });

    const result = JSON.parse(response.text || "{}");
    return result as EvaluationResult;
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    if (error.message?.includes('403')) {
      throw new Error("API Key invalid or restricted. Please check your settings.");
    }
    throw new Error("Failed to evaluate the article. Please check your connection.");
  }
};
