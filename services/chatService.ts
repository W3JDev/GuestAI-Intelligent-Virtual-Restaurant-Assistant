
import { GoogleGenAI, Chat, GenerateContentResponse, Part } from "@google/genai";
import { FullMenuItem, OrderItem, OrderItemOption, OrderItemModifier, InteractiveFlowData, WaiterAIResponse as WaiterAIResponseType } from '../types'; // Renamed WaiterAIResponse to avoid conflict
import { initDB, populateInitialData, getAllMenuItems as dbGetAllMenuItems } from './db';
import { PromptBuilder } from './promptService'; // Import PromptBuilder namespace

export { getAllMenuItems } from './db';

// Keys should match item.category.split('/')[1] (e.g., "Soda", "Sharing_Jug")
export interface SimulatedMenuStructure {
  Food: {
    Bread_Spread: FullMenuItem[];
    Small_Vegetable: FullMenuItem[];
    Pasta_Rice: FullMenuItem[];
    Large_Sharing: FullMenuItem[];
    Desserts: FullMenuItem[];
    Weekend_Specials: FullMenuItem[];
    [key: string]: FullMenuItem[]; // Allow for dynamically added food categories
  };
  Beverages: {
    Craft_Drinks: FullMenuItem[];
    Non_Alcoholic_Wine: FullMenuItem[];
    Sharing_Jug: FullMenuItem[]; // Singular
    Soda: FullMenuItem[];        // Singular
    House_Pours_White: FullMenuItem[];
    House_Pours_Red: FullMenuItem[];
    Sparkling_Wines: FullMenuItem[];
    White_Wines: FullMenuItem[];
    Red_Wines: FullMenuItem[];
    Coffee: FullMenuItem[];
    [key: string]: FullMenuItem[]; // Allow for dynamically added beverage categories
  };
}

let LOADED_MENU_STRUCTURE: SimulatedMenuStructure | null = null;

// Use the imported type directly
export type WaiterAIResponse = WaiterAIResponseType;


export interface ChatServiceResponse {
  reply: WaiterAIResponse | string;
  isRichContent: boolean;
  currentOrder?: OrderItem[];
  orderSubtotal?: number;
  orderSummaryForReceipt?: string;
  scheduledFor?: string;
  confirmationCode?: string; 
  reservationDetails?: WaiterAIResponse['reservationDetails'];
  interactiveFlow?: InteractiveFlowData; 
}

// --- Menu Data Management ---
async function loadAndStructureMenuData(): Promise<SimulatedMenuStructure> {
  if (LOADED_MENU_STRUCTURE) {
    return LOADED_MENU_STRUCTURE;
  }

  const items = await dbGetAllMenuItems(); 
  const menuStructure: SimulatedMenuStructure = {
    Food: { 
        Bread_Spread: [], Small_Vegetable: [], Pasta_Rice: [], Large_Sharing: [], 
        Desserts: [], Weekend_Specials: [] 
    },
    Beverages: { 
        Craft_Drinks: [], Non_Alcoholic_Wine: [], Sharing_Jug: [], Soda: [], 
        House_Pours_White: [], House_Pours_Red: [], Sparkling_Wines: [], 
        White_Wines: [], Red_Wines: [], Coffee: [] 
    },
  };

  items.forEach(item => {
    const [type, categoryName] = item.category.split('/'); 
    
    if (type === 'Food') {
      if (!menuStructure.Food[categoryName]) {
        console.warn(`Dynamically adding food category to menuStructure: ${categoryName}`);
        menuStructure.Food[categoryName] = [];
      }
      (menuStructure.Food[categoryName] as FullMenuItem[]).push(item);
    } else if (type === 'Beverages') {
      if (!menuStructure.Beverages[categoryName]) {
        console.warn(`Dynamically adding beverage category to menuStructure: ${categoryName}`);
        menuStructure.Beverages[categoryName] = [];
      }
      (menuStructure.Beverages[categoryName] as FullMenuItem[]).push(item);
    } else {
      console.warn(`Unknown item type from DB: ${type} for item ${item.id} with category ${item.category}`);
    }
  });
  
  LOADED_MENU_STRUCTURE = menuStructure;
  console.log("LOADED_MENU_STRUCTURE from DB:", LOADED_MENU_STRUCTURE);
  return LOADED_MENU_STRUCTURE;
}

export async function initializeMenuSystem(): Promise<void> {
  await initDB();
  await populateInitialData(); 
  await loadAndStructureMenuData(); 
  console.log("Menu system initialized and data loaded/structured.");
}

export const getSimulatedMenu = (): SimulatedMenuStructure | null => {
  return LOADED_MENU_STRUCTURE;
};


// --- Gemini Chat Session Management ---
namespace GeminiSessionManager {
  let ai: GoogleGenAI | undefined;
  const chatSessions: Record<string, Chat> = {};
  const sessionSystemPrompts: Record<string, string> = {}; // Store system prompt per session


  function initializeAiInstance() {
    if (!ai) {
      if (process.env.API_KEY) {
        ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      } else {
        console.error("API_KEY is not set in process.env. Chat functionality will be impaired.");
      }
    }
  }

  export function getChatSession(sessionId: string, userName?: string): Chat | null {
    initializeAiInstance();
    if (!ai) return null;

    if (!LOADED_MENU_STRUCTURE) {
      console.error("Chat session requested before menu data is loaded. Aborting session creation.");
      return null;
    }
    
    const newSystemInstruction = PromptBuilder.getSystemInstruction(LOADED_MENU_STRUCTURE, userName);

    if (!chatSessions[sessionId] || sessionSystemPrompts[sessionId] !== newSystemInstruction) {
      console.log(`Creating new chat session or updating system prompt for session ${sessionId}. User: ${userName || 'N/A'}`);
      sessionSystemPrompts[sessionId] = newSystemInstruction;
      chatSessions[sessionId] = ai.chats.create({
        model: 'gemini-2.5-flash-preview-04-17',
        config: {
          systemInstruction: newSystemInstruction,
          responseMimeType: "application/json",
        },
        history: [] 
      });
    }
    return chatSessions[sessionId];
  }

  export function resetChatSession(sessionId: string, userName?: string): void { 
    if (chatSessions[sessionId]) {
      delete chatSessions[sessionId];
      delete sessionSystemPrompts[sessionId];
    }
  }
}

export const resetChatSession = GeminiSessionManager.resetChatSession;

// --- Response Parsing ---
function parseGeminiJsonResponse(rawJsonText: string): { parsedReply: WaiterAIResponse | null, isRich: boolean, fallbackText: string } {
  let cleanedJsonText = rawJsonText.trim();
  const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
  const match = cleanedJsonText.match(fenceRegex);
  if (match && match[2]) {
    cleanedJsonText = match[2].trim();
  }

  try {
    const parsed = JSON.parse(cleanedJsonText) as Partial<WaiterAIResponseType>;

    let validatedOrderItems: OrderItem[] = [];
    if (Array.isArray(parsed.currentOrder)) {
      validatedOrderItems = parsed.currentOrder.map((item: any): OrderItem => {
        const orderItem = item || {}; // Ensure item is not null/undefined

        const basePrice = typeof orderItem.base_price === 'number' ? orderItem.base_price : 0;
        const quantity = typeof orderItem.quantity === 'number' && orderItem.quantity > 0 ? orderItem.quantity : 1;
        
        const selectedOptions = Array.isArray(orderItem.selected_options)
          ? orderItem.selected_options.map((opt: any): OrderItemOption => {
              const option = opt || {};
              return {
                option_id: typeof option.option_id === 'string' ? option.option_id : `unknown_opt_${Date.now()}_${Math.random()}`,
                option_name: typeof option.option_name === 'string' ? option.option_name : 'Unknown Option',
                value: typeof option.value === 'string' ? option.value : 'N/A',
              };
            }).filter((opt: OrderItemOption) => !opt.option_id.startsWith('unknown_opt_')) // Filter out malformed
          : [];

        const appliedModifiers = Array.isArray(orderItem.applied_modifiers)
          ? orderItem.applied_modifiers.map((mod: any): OrderItemModifier => {
              const modifier = mod || {};
              return {
                modifier_id: typeof modifier.modifier_id === 'string' ? modifier.modifier_id : `unknown_mod_${Date.now()}_${Math.random()}`,
                mod_name: typeof modifier.mod_name === 'string' ? modifier.mod_name : 'Unknown Modifier',
                price_change: typeof modifier.price_change === 'number' ? modifier.price_change : 0,
              };
            }).filter((mod: OrderItemModifier) => !mod.modifier_id.startsWith('unknown_mod_')) // Filter out malformed
          : [];
        
        let finalItemPrice = typeof orderItem.final_item_price === 'number' ? orderItem.final_item_price : -1;
        if (finalItemPrice === -1) { // If not provided or invalid, calculate it
            let calculatedPrice = basePrice;
            appliedModifiers.forEach(mod => {
                calculatedPrice += mod.price_change;
            });
            finalItemPrice = calculatedPrice * quantity;
        }

        return {
          item_id: typeof orderItem.item_id === 'string' && orderItem.item_id.trim() !== '' ? orderItem.item_id : `unknown_item_${Date.now()}_${Math.random()}`,
          item_name: typeof orderItem.item_name === 'string' ? orderItem.item_name : 'Unknown Item',
          quantity: quantity,
          base_price: basePrice,
          selected_options: selectedOptions,
          applied_modifiers: appliedModifiers,
          final_item_price: finalItemPrice,
        };
      }).filter((item: OrderItem) => !item.item_id.startsWith('unknown_item_')); // Filter out fundamentally broken items
    }


    // Validate core fields and provide defaults if necessary
    const validatedResponse: WaiterAIResponse = {
        thought: typeof parsed.thought === 'string' ? parsed.thought : "AI thought process unclear.",
        move1: typeof parsed.move1 === 'string' ? parsed.move1 : "unknownMove",
        move2: typeof parsed.move2 === 'string' ? parsed.move2 : undefined,
        move3: typeof parsed.move3 === 'string' ? parsed.move3 : undefined,
        move4: typeof parsed.move4 === 'string' ? parsed.move4 : undefined,
        move5: typeof parsed.move5 === 'string' ? parsed.move5 : undefined,
        response: typeof parsed.response === 'string' ? parsed.response : "I'm having a little trouble forming a response. Please try again.",
        currentOrder: validatedOrderItems, // Use the new deeply validated items
        orderSubtotal: typeof parsed.orderSubtotal === 'number' ? parsed.orderSubtotal : 0,
        orderSummaryForReceipt: typeof parsed.orderSummaryForReceipt === 'string' ? parsed.orderSummaryForReceipt : "",
        scheduledFor: typeof parsed.scheduledFor === 'string' ? parsed.scheduledFor : undefined,
        confirmationCode: typeof parsed.confirmationCode === 'string' ? parsed.confirmationCode : undefined,
        reservationDetails: typeof parsed.reservationDetails === 'object' && parsed.reservationDetails !== null ? parsed.reservationDetails : undefined,
        interactiveFlow: typeof parsed.interactiveFlow === 'object' && parsed.interactiveFlow !== null ? parsed.interactiveFlow : undefined,
    };
    
    if (validatedResponse.move1 && validatedResponse.response) {
         return { parsedReply: validatedResponse, isRich: true, fallbackText: cleanedJsonText };
    }
    console.warn("Parsed JSON, even after defaults, does not meet minimal WaiterAIResponse structure (missing move1 or response):", validatedResponse);
    return { parsedReply: null, isRich: false, fallbackText: cleanedJsonText };

  } catch (parseError) {
    console.warn("Failed to parse Gemini response as JSON:", parseError, "\nRaw text:", cleanedJsonText);
    return { parsedReply: null, isRich: false, fallbackText: cleanedJsonText };
  }
}

async function getFallbackStateFromHistory(chat: Chat): Promise<Partial<ChatServiceResponse>> {
    let fallbackState: Partial<ChatServiceResponse> = { currentOrder: [], orderSubtotal: 0, orderSummaryForReceipt: "", scheduledFor: undefined, confirmationCode: undefined, reservationDetails: undefined, interactiveFlow: undefined };
    try {
        const history = await chat.getHistory(); 
        const lastModelMessage = history.filter(h => h.role === 'model').pop();
        if (lastModelMessage?.parts[0]?.text) {
            const { parsedReply: lastValidResponse } = parseGeminiJsonResponse(lastModelMessage.parts[0].text);
            if (lastValidResponse) {
                fallbackState = { 
                    currentOrder: lastValidResponse.currentOrder, 
                    orderSubtotal: lastValidResponse.orderSubtotal, 
                    orderSummaryForReceipt: lastValidResponse.orderSummaryForReceipt,
                    scheduledFor: lastValidResponse.scheduledFor,
                    confirmationCode: lastValidResponse.confirmationCode,
                    reservationDetails: lastValidResponse.reservationDetails,
                    interactiveFlow: lastValidResponse.interactiveFlow
                };
            }
        }
    } catch (historyError) {
        console.warn("Could not retrieve fallback state from history:", historyError);
    }
    return fallbackState;
}


// --- Main Service Function ---
export const sendMessageToGemini = async (
  contents: string | { parts: Part[] },
  sessionId: string,
  userName?: string 
): Promise<ChatServiceResponse> => {
  if (!LOADED_MENU_STRUCTURE) {
    console.warn("sendMessageToGemini called before menu system fully ready. Attempting to initialize...");
    await initializeMenuSystem();
    if (!LOADED_MENU_STRUCTURE) {
      const criticalErrorMsg = "Menu data is not available. Cannot process messages.";
      console.error(criticalErrorMsg);
      return {
        reply: { thought: "Critical Error: Menu data failed to load.", move1: "escalateToHumanSimulated", response: `Error: ${criticalErrorMsg}. Please try reloading the application.`, currentOrder: [], orderSubtotal: 0, orderSummaryForReceipt: "" } as WaiterAIResponse, 
        isRichContent: true
      };
    }
  }

  const chat = GeminiSessionManager.getChatSession(sessionId, userName); 
  if (!chat) {
    const errorMessage = "Chat service is not available. API Key might be missing, or menu data failed to load.";
    console.error(errorMessage);
    return {
      reply: { thought: "Critical Error: Chat service not initialized or menu data missing.", move1: "escalateToHumanSimulated", response: `Error: ${errorMessage}. Please try reloading the application.`, currentOrder: [], orderSubtotal: 0, orderSummaryForReceipt: "" } as WaiterAIResponse, 
      isRichContent: true
    };
  }

  try {
    let messageForChat: string | Part[];
    
    if (typeof contents === 'string') {
      messageForChat = contents;
    } else { 
      messageForChat = contents.parts;
    }
    
    const result: GenerateContentResponse = await chat.sendMessage({ message: messageForChat });
    
    const rawTextOutput = result.text || "";
    const { parsedReply, isRich, fallbackText } = parseGeminiJsonResponse(rawTextOutput);

    if (isRich && parsedReply) {
      return {
        reply: parsedReply,
        isRichContent: true,
        currentOrder: parsedReply.currentOrder,
        orderSubtotal: parsedReply.orderSubtotal,
        orderSummaryForReceipt: parsedReply.orderSummaryForReceipt,
        scheduledFor: parsedReply.scheduledFor,
        confirmationCode: parsedReply.confirmationCode,
        reservationDetails: parsedReply.reservationDetails,
        interactiveFlow: parsedReply.interactiveFlow 
      };
    } else {
      const fallbackState = await getFallbackStateFromHistory(chat);
      let replyContent: WaiterAIResponse | string;
      if (fallbackText && Object.keys(fallbackState).filter(k => fallbackState[k as keyof typeof fallbackState] !== undefined).length === 0) { // Check if fallbackState is truly empty beyond defaults
          replyContent = fallbackText; 
      } else {
          replyContent = {
              thought: "Fallback: Could not parse response or response was not rich. Using fallback text.",
              move1: "handleOutOfScopeQuery",
              response: fallbackText || "I encountered an issue with the response format.",
              currentOrder: fallbackState.currentOrder || [], // Ensure array
              orderSubtotal: fallbackState.orderSubtotal || 0, // Ensure number
              orderSummaryForReceipt: fallbackState.orderSummaryForReceipt || "",
              scheduledFor: fallbackState.scheduledFor,
              confirmationCode: fallbackState.confirmationCode,
              reservationDetails: fallbackState.reservationDetails,
              interactiveFlow: fallbackState.interactiveFlow
          } as WaiterAIResponse;
      }
      
      return { 
          reply: replyContent, 
          isRichContent: typeof replyContent === 'object', 
          currentOrder: typeof replyContent === 'object' ? replyContent.currentOrder : fallbackState.currentOrder || [],
          orderSubtotal: typeof replyContent === 'object' ? replyContent.orderSubtotal : fallbackState.orderSubtotal || 0,
          orderSummaryForReceipt: typeof replyContent === 'object' ? replyContent.orderSummaryForReceipt : fallbackState.orderSummaryForReceipt || "",
          scheduledFor: typeof replyContent === 'object' ? replyContent.scheduledFor : fallbackState.scheduledFor,
          confirmationCode: typeof replyContent === 'object' ? replyContent.confirmationCode : fallbackState.confirmationCode,
          reservationDetails: typeof replyContent === 'object' ? replyContent.reservationDetails : fallbackState.reservationDetails,
          interactiveFlow: typeof replyContent === 'object' ? replyContent.interactiveFlow : fallbackState.interactiveFlow,
      };
    }

  } catch (error) {
    console.error("Error sending message to Gemini:", error);
    let errorMessageText = "An unexpected error occurred with the AI.";
    if (error instanceof Error) errorMessageText = `Gemini API Error: ${error.message}`;
    
    const lastKnownOrderState = await getFallbackStateFromHistory(chat);

    return {
      reply: {
        thought: "Error: API communication failure.", move1: "escalateToHumanSimulated",
        response: `Error: ${errorMessageText}. Please try again.`,
        currentOrder: lastKnownOrderState.currentOrder || [],
        orderSubtotal: lastKnownOrderState.orderSubtotal || 0,
        orderSummaryForReceipt: lastKnownOrderState.orderSummaryForReceipt || "",
        scheduledFor: lastKnownOrderState.scheduledFor,
        confirmationCode: lastKnownOrderState.confirmationCode,
        reservationDetails: lastKnownOrderState.reservationDetails,
        interactiveFlow: lastKnownOrderState.interactiveFlow
      } as WaiterAIResponse, 
      isRichContent: true, 
      ...lastKnownOrderState, // Spread lastKnownOrderState but ensure its properties are defaulted if undefined
      currentOrder: lastKnownOrderState.currentOrder || [],
      orderSubtotal: lastKnownOrderState.orderSubtotal || 0,
    };
  }
};
