
import { useState, useCallback, useEffect } from 'react';
import { FullMenuItem } from '../types';
import { initializeMenuSystem, getAllMenuItems as fetchAllMenuItems, resetChatSession as resetGeminiChatSession } from '../services/chatService';

export const useAppSetup = () => {
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const [isMenuSystemReady, setIsMenuSystemReady] = useState<boolean>(false);
  const [allMenuItems, setAllMenuItems] = useState<FullMenuItem[]>([]);
  const [initializationError, setInitializationError] = useState<string | null>(null);

  const generateNewSessionId = () => 'session_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15);

  const initializeSessionAndMenu = useCallback(async (userName?: string) => { // Added userName
    setInitializationError(null);
    let sessionId = sessionStorage.getItem('chatSessionId');
    if (!sessionId) {
      sessionId = generateNewSessionId();
      sessionStorage.setItem('chatSessionId', sessionId);
    }
    setCurrentSessionId(sessionId);

    if (!isMenuSystemReady) {
      try {
        await initializeMenuSystem(); // Menu data is global, not user-specific
        const menuItems = await fetchAllMenuItems();
        setAllMenuItems(menuItems);
        setIsMenuSystemReady(true);
        console.log("Menu system and session initialized in hook. All menu items loaded:", menuItems.length);
        // Ensure chat session for this sessionId is (re)created with potential userName
        resetGeminiChatSession(sessionId, userName); 
      } catch (err) {
        console.error("Failed to initialize menu system in hook:", err);
        const errorMsg = err instanceof Error ? err.message : "Unknown error during initialization";
        setInitializationError(`Failed to load menu data: ${errorMsg}. Please try refreshing the page.`);
        setIsMenuSystemReady(false); 
      }
    } else {
      // If menu is ready, still ensure chat session has the correct system prompt (e.g., with username)
      resetGeminiChatSession(sessionId, userName);
    }
    return sessionId;
  }, [isMenuSystemReady]);

  const resetAppSessionParts = useCallback(async (userName?: string) => { // Added userName
    if (currentSessionId) {
        resetGeminiChatSession(currentSessionId, userName); 
    }
    const newSessionId = generateNewSessionId();
    sessionStorage.setItem('chatSessionId', newSessionId);
    setCurrentSessionId(newSessionId);
    // Crucially, ensure the new session is also initialized with the correct prompt
    resetGeminiChatSession(newSessionId, userName); 
  }, [currentSessionId]);


  return {
    currentSessionId,
    isMenuSystemReady,
    allMenuItems,
    initializationError,
    initializeSessionAndMenu,
    resetAppSessionParts,
  };
};