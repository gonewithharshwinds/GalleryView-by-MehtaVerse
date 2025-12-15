import { GoogleGenAI, Type } from "@google/genai";
import { DataTopic, AppSettings } from "../types";

const getAIClient = () => {
  const settingsStr = localStorage.getItem('gallery_settings');
  if (!settingsStr) throw new Error("Settings not configured");
  
  const settings: AppSettings = JSON.parse(settingsStr);
  if (!settings.googleApiKey) throw new Error("Missing API Key");
  
  return new GoogleGenAI({ apiKey: settings.googleApiKey });
};

export const generateImageTags = async (imageName: string): Promise<string[]> => {
  try {
    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Generate 5 concise, relevant categorization tags for a hypothetical high-quality stock photo named "${imageName}". Return only the tags as a JSON string array.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING
          }
        }
      }
    });

    const text = response.text;
    if (!text) return [];
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini tagging error:", error);
    if ((error as Error).message === "Missing API Key") throw error;
    return ["generic", "photo", "asset"];
  }
};

export const analyzeImageContext = async (imageName: string): Promise<string> => {
  try {
    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Write a short, professional description (max 2 sentences) for an image titled "${imageName}". Assume it is a stunning professional photograph.`,
    });

    return response.text || "No description available.";
  } catch (error) {
    console.error("Gemini description error:", error);
    if ((error as Error).message === "Missing API Key") throw error;
    return "Could not generate description.";
  }
};

export const extractDataFromImage = async (imageName: string, topic: DataTopic): Promise<string> => {
  try {
    const ai = getAIClient();
    let prompt = "";
    
    switch (topic) {
      case DataTopic.CONTACTS:
        prompt = `Analyze the image "${imageName}" (hypothetically). Extract any contact details found (Name, Phone, Email, Address, Organization). Format the output strictly as a CSV string with headers.`;
        break;
      case DataTopic.CHAT:
        prompt = `Analyze the image "${imageName}" (hypothetically) as a chat screenshot. Extract the conversation. Format the output strictly as a CSV with headers: Timestamp, Sender, Message.`;
        break;
      case DataTopic.DOCS:
        prompt = `Perform OCR on the image "${imageName}" (hypothetically). Extract the text as a structured essay or letter. Return the result in Markdown format.`;
        break;
      case DataTopic.MISC:
      default:
        prompt = `Analyze the image "${imageName}" (hypothetically). Extract all intelligible data and list it in a structured Markdown format.`;
        break;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "No data extracted.";
  } catch (error) {
    console.error("Gemini extraction error:", error);
    if ((error as Error).message === "Missing API Key") throw error;
    return "Error during extraction.";
  }
};