
import { ContactData } from "../types";

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

const getGroqApiKey = () => {
  const env = (import.meta as any).env;
  if (env && env.VITE_GROQ_API_KEY) {
    return env.VITE_GROQ_API_KEY;
  }
  if (typeof process !== 'undefined' && process.env.VITE_GROQ_API_KEY) {
    return process.env.VITE_GROQ_API_KEY;
  }
  return '';
};

/**
 * Extracts contact information from an image using Groq Cloud API
 */
export const extractContactInfo = async (base64Image: string): Promise<ContactData> => {
  const apiKey = localStorage.getItem('VITE_GROQ_API_KEY') || getGroqApiKey();

  if (!apiKey) {
    throw new Error("GROQ_API_KEY_MISSING");
  }

  try {
    const compressedImageUri = await compressImage(base64Image);
    const base64Data = compressedImageUri.startsWith('data:') ? compressedImageUri : `data:image/jpeg;base64,${compressedImageUri}`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.2-11b-vision-preview",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Extract contact information from this ID card or business card. Return ONLY a valid JSON object matching the schema below. Do not output any markdown code blocks, backticks, or extra conversational text. Return exactly a valid JSON parseable string.\n\nRequired JSON schema:\n{\n  \"name\": \"Full name of the person\",\n  \"company_name\": \"Name of the company or organization\",\n  \"designation\": \"Job title or designation\",\n  \"email_1\": \"Primary email address\",\n  \"email_2\": \"Secondary email address (if any)\",\n  \"phone_1\": \"Primary phone number\",\n  \"phone_2\": \"Secondary phone number (if any)\",\n  \"address\": \"Full physical address\"\n}\n\nIf a field is not found, keep it as empty string (\" \")."
              },
              {
                type: "image_url",
                image_url: {
                  url: base64Data
                }
              }
            ]
          }
        ],
        response_format: {
          type: "json_object"
        },
        temperature: 0.1
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Groq API Error:", errText);
      try {
        const errJson = JSON.parse(errText);
        if (response.status === 429) {
          throw new Error("Too many requests on Groq API. Please wait a moment.");
        }
        throw new Error(errJson.error?.message || "Failed to call Groq API");
      } catch {
        throw new Error(`Groq API Error (${response.status}): ${errText}`);
      }
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content;
    if (content) {
      return JSON.parse(content.trim()) as ContactData;
    } else {
      throw new Error("No data extracted from the image.");
    }
  } catch (error: any) {
    console.error("Groq Extraction Error:", error);
    if (error.message === "GROQ_API_KEY_MISSING") {
      throw new Error("Groq API Key is missing. Please configure it in the settings.");
    }
    throw error;
  }
};
