
export enum SenderType {
  USER = 'user',
  BOT = 'bot',
}

export interface Message {
  id: string;
  text: string; // For BOT, this can be a JSON string of WaiterAIResponse. For USER, it's their typed text or a descriptor for audio/file.
  sender: SenderType;
  timestamp: Date;
  isRich?: boolean; // Indicates if 'text' is a JSON string for rich content (BOT)
  audioUrl?: string; // URL for playing back recorded audio sent by user
  filePreviewUrl?: string; // URL for image preview sent by user
  fileName?: string; // Name of the file sent by user
  fileType?: string; // Mime type of the file sent by user
  activePreferences?: string[]; // Store what preferences were active when user sent the message
}

// Basic MenuItem for cards, etc.
export interface MenuItem {
  id: string; // Unique identifier for the menu item
  name: string;
  description: string;
  shortDescription?: string; // Concise description for small cards
  price: number;
  imageUrl: string;
  allergens?: string[];
  dietary_tags?: string[];
  displayTags?: string[]; // For UI display, e.g. ["Spicy", "GF"]
}

// Detailed MenuItem structure for database and full display
export interface MenuItemAvailableOption {
  id: string; // e.g., "OPT001"
  name: string; // e.g., "Doneness", "Milk Type"
  values: string[]; // e.g., ["Rare", "Medium", "Well-Done"], ["Whole Milk", "Oat Milk"]
  default: string; // e.g., "Medium-Rare", "Whole Milk"
}

export interface MenuItemAvailableModifier {
  id: string; // e.g., "MOD001"
  name: string; // e.g., "Extra Spicy", "Oat Milk Substitute"
  price_change: number; // e.g., 0.00, 2.00
  description: string;
}

export interface FullMenuItem extends MenuItem {
  category: string; // e.g., "Food/Small_Plates", "Beverages/Coffee"
  ingredients: string[];
  available_options?: MenuItemAvailableOption[];
  available_modifiers?: MenuItemAvailableModifier[];
}

export interface OrderItemOption {
  option_id: string; // e.g. "OPT_COF_Milk"
  option_name: string; // e.g. "Milk Choice"
  value: string; // e.g. "Oat Milk" - this is the selected value
}

export interface OrderItemModifier {
  modifier_id: string; // e.g. "MOD_COF_Oat"
  mod_name: string; // e.g. "Oat Milk"
  price_change: number; // e.g. 2.00
}

export interface OrderItem {
  item_id: string; // Ensure this is string, matching FullMenuItem.id
  item_name: string;
  quantity: number;
  base_price: number; // Price of the item BEFORE modifiers
  selected_options: OrderItemOption[];
  applied_modifiers: OrderItemModifier[];
  final_item_price: number; // Total price for this line item (quantity * (base_price + all modifier price_changes))
}

export interface HistoricalOrder {
  id: string; // Unique ID for this historical order entry, e.g., timestamp based
  timestamp: string; // ISO string of when the order was confirmed
  items: OrderItem[];
  subtotal: number;
  scheduledFor?: string | null; // ISO string if it was a scheduled order
  confirmationCode?: string; // Added for pre-order confirmation codes
  // restaurantNotes?: string; // Future: any notes captured during order
}

// --- Interactive Flow Types ---
export interface ReservationInputContext {
  name?: string; // User's name for the reservation
  phone?: string; // User's phone number for the reservation
  guests?: number | string; // string for "Other" or if AI parses text input
  date?: string; // YYYY-MM-DD or keywords like "today", "tomorrow"
  time?: string; // HH:MM
  notes?: string;
}

export interface InteractiveFlowOption {
  label: string;
  value: string; // Value to send back to AI if this option is chosen
  emoji?: string;
  isTextInputTrigger?: boolean; // If true, indicates that selecting this option might require subsequent text input from the user
}

export interface InteractiveFlowData {
  type: 'reservation'; // Could be expanded for other flows (e.g., 'feedback', 'detailedOrderCustomization')
  step: 'askGuestCount' | 'askName' | 'askDate' | 'askTime' | 'askPhone' | 'askNotes' | 'askConfirmation' | 'completed' | 'cancelled';
  promptText?: string; // The AI's direct question or statement for this step (e.g., "For how many guests?")
  options?: InteractiveFlowOption[]; // Choices for the user to click
  currentContext?: ReservationInputContext; // The state of reservation data as known by the AI *after* processing the last user input
}


// This interface is defined in chatService.ts but conceptually referenced here
// for understanding what the AI should output.
export interface WaiterAIResponse {
  thought: string;
  move1: string;
  move2?: string;
  move3?: string;
  move4?: string;
  move5?: string;
  response: string;
  currentOrder: OrderItem[];
  orderSubtotal: number;
  orderSummaryForReceipt: string;
  scheduledFor?: string;
  confirmationCode?: string; // Added for reservation and pre-order confirmation codes
  reservationDetails?: {
    name?: string; 
    phone?: string; 
    guests: number | string; 
    date: string;
    time: string;
    status: string; 
    notes?: string;
  };
  interactiveFlow?: InteractiveFlowData; 
}