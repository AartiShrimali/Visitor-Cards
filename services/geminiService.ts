import { GoogleGenAI, Type } from "@google/genai";
import { ContactData } from "../types";

// Schema for the extracted data
const contactSchema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING, description: "Full name of the person" },
    company_name: { type: Type.STRING, description: "Name of the company or organization" },
    designation: { type: Type.STRING, description: "Job title or designation" },
    email_1: { type: Type.STRING, description: "Primary email address" },
    email_2: { type: Type.STRING, description: "Secondary email address (if any)" },
    phone_1: { type: Type.STRING, description: "Primary phone number" },
    phone_2: { type: Type.STRING, description: "Secondary phone number (if any)" },
    address: { type: Type.STRING, description: "Full physical address" },
  },
  required: ["name", "company_name", "designation", "email_1", "phone_1", "address"],
};

// Helper: Compress image to save bandwidth (Resize to max 1024px, JPEG 80% quality)
const compressImage = (base64Str: string, maxWidth = 1024, quality = 0.8): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      // Calculate new dimensions
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        // Returns full data URI
        resolve(canvas.toDataURL('image/jpeg', quality));
      } else {
        resolve(base64Str); // Fallback
      }
    };
    img.onerror = () => resolve(base64Str); // Fallback
  });
};

export const extractContactInfo = async (base64Image: string): Promise<ContactData> => {
  // STRICT VALIDATION: Check for key using Vite standard first
  let apiKey = '';
  const env = (import.meta as any).env;
  
  if (env && env.VITE_API_KEY) {
    apiKey = env.VITE_API_KEY;
  } else if (typeof process !== 'undefined' && process.env.API_KEY) {
    apiKey = process.env.API_KEY;
  }
  
  if (!apiKey || apiKey.length === 0) {
    console.error("Critical Error: API Key is missing.");
    throw new Error("API Key Missing. Go to Vercel Settings > Environment Variables and add 'VITE_API_KEY'.");
  }

  try {
    // Initialize the Gemini client
    const ai = new GoogleGenAI({ apiKey: apiKey });

    // COMPRESS IMAGE BEFORE SENDING
    // This reduces bandwidth from ~5MB to ~150KB per request
    const compressedImageUri = await compressImage(base64Image);
    const cleanBase64 = compressedImageUri.split(',')[1] || compressedImageUri;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: cleanBase64,
            },
          },
          {
            text: "Extract contact information from this ID card or business card. If a field is not found, return an empty string.",
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: contactSchema,
        systemInstruction: "You are an expert OCR and data extraction assistant. Your job is to accurately extract contact details from images of ID cards and business cards.",
      },
    });

    if (response.text) {
      return JSON.parse(response.text) as ContactData;
    } else {
      throw new Error("No data extracted from the image. The model returned an empty response.");
    }
  } catch (error: any) {
    console.error("Gemini Extraction Error Full Details:", error);
    
    // Provide user-friendly error messages based on common issues
    if (error.message && error.message.includes("API key")) {
       throw new Error("Invalid API Key. Please check your Vercel Environment Variables.");
    }
    if (error.status === 429) {
       throw new Error("Too many requests. Please wait a moment and try again.");
    }
    
    throw error;
  }
};