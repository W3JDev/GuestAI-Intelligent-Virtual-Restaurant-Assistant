
import { useState, useCallback } from 'react';
import { Message, SenderType, OrderItem as OrderItemType } from '../types';
import { sendMessageToGemini as sendGeminiMessage, ChatServiceResponse, WaiterAIResponse } from '../services/chatService';
import type { Part } from "@google/genai";

export const useChatLogic = (
    currentSessionId: string,
    userName: string | null, // Added userName
    initializeSession: () => Promise<string | null>,
    currentOrderState: OrderItemType[], 
    currentSubtotalState: number,
    currentConfirmedSchedule: string | null

) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (text: string, mediaParts: Part[]): Promise<ChatServiceResponse | null> => {
    if (!currentSessionId && initializeSession) {
        const newInitializedSessionId = await initializeSession();
        if (!newInitializedSessionId) {
            const sessionError = "It looks like I had a hiccup starting our conversation.";
            setError(sessionError);
            setIsLoading(false);
            const errorBotResponse: WaiterAIResponse = {
                thought: "Error: Client-side session initialization failure before sending message.",
                move1: "escalateToHumanSimulated",
                response: `${sessionError} Could you please try sending your message again?`,
                currentOrder: currentOrderState, 
                orderSubtotal: currentSubtotalState, 
                orderSummaryForReceipt: "",
                scheduledFor: currentConfirmedSchedule,
            };
            const errorBotMessage: Message = {
                id: (Date.now() + 1).toString(), text: JSON.stringify(errorBotResponse),
                sender: SenderType.BOT, timestamp: new Date(), isRich: true,
            };
            setMessages((prevMessages) => [...prevMessages, errorBotMessage]);
            return null;
        }
    }

    const contentForGemini: string | { parts: Part[] } = 
        mediaParts.length > 0 
            ? { parts: (text.trim() ? [{ text }, ...mediaParts] : mediaParts) } 
            : text;
    
    if (typeof contentForGemini === 'string' && !contentForGemini.trim()) {
        if (mediaParts.length === 0) { 
             setError("Cannot send an empty message.");
             setIsLoading(false);
             return null;
        }
    }
    if (typeof contentForGemini === 'object' && contentForGemini.parts.length === 0) {
        setError("Cannot send an empty message.");
        setIsLoading(false);
        return null;
    }


    try {
      // Pass userName to sendGeminiMessage
      const response: ChatServiceResponse = await sendGeminiMessage(contentForGemini, currentSessionId, userName || undefined);
      
      let botMessageText: string;
      let isRichContent = false;
      
      if (response.isRichContent && typeof response.reply === 'object') {
        botMessageText = JSON.stringify(response.reply);
        isRichContent = true;
      } else if (typeof response.reply === 'string') {
        const wrappedReply: WaiterAIResponse = {
            thought: "Fallback: chatService returned plain text, wrapping into rich format.",
            move1: "handleOutOfScopeQuery", 
            response: response.reply,
            currentOrder: response.currentOrder || currentOrderState,
            orderSubtotal: response.orderSubtotal || currentSubtotalState,
            orderSummaryForReceipt: response.orderSummaryForReceipt || "",
            scheduledFor: response.scheduledFor || currentConfirmedSchedule,
            reservationDetails: response.reservationDetails
        };
        botMessageText = JSON.stringify(wrappedReply);
        isRichContent = true;
      } else {
        const errorReply: WaiterAIResponse = {
            thought: "Error: Unexpected response format from chatService.",
            move1: "escalateToHumanSimulated",
            response: "I'm sorry, I seem to be having a little trouble with the response format. Could you try again?",
            currentOrder: currentOrderState, orderSubtotal: currentSubtotalState, orderSummaryForReceipt: "",
            scheduledFor: currentConfirmedSchedule,
        };
        botMessageText = JSON.stringify(errorReply);
        isRichContent = true;
      }
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: botMessageText,
        sender: SenderType.BOT,
        timestamp: new Date(),
        isRich: isRichContent,
      };
      setMessages((prevMessages) => [...prevMessages, botMessage]);
      return response; 

    } catch (err) {
      const errorMessageText = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Failed to get response: ${errorMessageText}`);
      const errorBotResponse: WaiterAIResponse = {
        thought: "Error: Client-side exception during sendMessage.",
        move1: "escalateToHumanSimulated",
        response: `I'm sorry, I seem to be having a little trouble connecting right now. Please try sending your message again in a moment. (Details: ${errorMessageText})`,
        currentOrder: currentOrderState, 
        orderSubtotal: currentSubtotalState, 
        orderSummaryForReceipt: "",
        scheduledFor: currentConfirmedSchedule,
      };
      const errorBotMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: JSON.stringify(errorBotResponse),
        sender: SenderType.BOT,
        timestamp: new Date(),
        isRich: true,
      };
      setMessages((prevMessages) => [...prevMessages, errorBotMessage]);
      return null;
    }
  }, [currentSessionId, userName, initializeSession, setMessages, setError, setIsLoading, currentOrderState, currentSubtotalState, currentConfirmedSchedule]);

  const resetChatState = useCallback((loadInitialGreeting?: () => void, menuReady?: boolean) => {
    setMessages([]);
    if (loadInitialGreeting && menuReady) {
        loadInitialGreeting();
    }
    setInputValue('');
    setIsLoading(false);
    setError(null);
  }, [setMessages, setInputValue, setIsLoading, setError]);

  return {
    messages,
    inputValue,
    isLoading,
    error,
    setMessages,
    setInputValue,
    setIsLoading,
    setError,
    sendMessage,
    resetChatState,
  };
};