
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

const compressImage = (base64Str: string, maxWidth = 1024, quality = 0.8): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      } else {
        resolve(base64Str);
      }
    };
    img.onerror = () => resolve(base64Str);
  });
};

/**
 * Extracts contact information from an image using Gemini AI
 */
export const extractContactInfo = async (base64Image: string): Promise<ContactData> => {
  // Always use process.env.API_KEY directly as per SDK guidelines
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
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
      throw new Error("No data extracted from the image.");
    }
  } catch (error: any) {
    console.error("Gemini Extraction Error:", error);
    if (error.status === 429) {
      throw new Error("Too many requests. Please wait a moment.");
    }
    throw error;
  }
};
