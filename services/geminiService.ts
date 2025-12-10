import { GoogleGenAI, Chat, Type } from "@google/genai";
import { MOCK_INVENTORY } from "../constants";

let ai: GoogleGenAI | null = null;

const getAI = () => {
  if (!ai) {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
  return ai;
};

// System instruction for the Inventory Assistant
const SYSTEM_INSTRUCTION = `
You are the RIMS (Retail Inventory Management System) AI Assistant.
You are helping store managers and inventory officers optimize their stock.

You have access to the current inventory snapshot:
${JSON.stringify(MOCK_INVENTORY.map(p => ({ sku: p.sku, name: p.name, stock: p.stockQuantity, threshold: p.lowStockThreshold, price: p.sellingPrice })))}

Your capabilities:
1. Identify low stock items.
2. Suggest descriptions for new products based on a name.
3. Analyze potential value of stock.
4. Draft supplier emails for restocks.

Keep responses professional, data-driven, and concise.
`;

export const createInventoryChat = (): Chat => {
  const aiClient = getAI();
  return aiClient.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      temperature: 0.5,
    }
  });
};

export interface ProductSuggestion {
  description: string;
  suggestedPrice: number;
  category: string;
  skuSuggestion: string;
}

// Function to auto-generate product details
export const generateProductDetails = async (productName: string): Promise<ProductSuggestion> => {
  const aiClient = getAI();
  
  const prompt = `
    I am adding a new product to my inventory: "${productName}".
    
    Please generate:
    1. A professional product description (1-2 sentences).
    2. A suggested selling price (USD) based on market averages.
    3. The most likely category (Electronics, Clothing, Home, Groceries, Office).
    4. A suggested SKU format (e.g., CAT-001).
    
    Return strictly JSON.
  `;

  try {
    const response = await aiClient.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            description: { type: Type.STRING },
            suggestedPrice: { type: Type.NUMBER },
            category: { type: Type.STRING },
            skuSuggestion: { type: Type.STRING }
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response");
    
    return JSON.parse(text) as ProductSuggestion;
  } catch (error) {
    console.error("AI Generation error:", error);
    return {
      description: "Could not generate description.",
      suggestedPrice: 0,
      category: "Home",
      skuSuggestion: "NEW-001"
    };
  }
};