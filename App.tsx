
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Message, SenderType, OrderItem as OrderItemType, FullMenuItem, OrderItemOption, OrderItemModifier, HistoricalOrder, ReservationInputContext } from './types'; // Added ReservationInputContext
import { MessageList } from './components/MessageList';
import { MessageInput } from './components/MessageInput';
import { OrderSidebar } from './components/OrderSidebar';
import { CustomizationModal } from './components/CustomizationModal';
import { DietaryPreferencesModal } from './components/DietaryPreferencesModal';
import { OrderHistoryModal } from './components/OrderHistoryModal';
import { HeaderActionMenu } from './components/HeaderActionMenu';
import { OnboardingFlow } from './components/OnboardingFlow'; 
import { WelcomeSuggestionCard } from './components/WelcomeSuggestionCard';
import { GuestAiLogo } from './components/GuestAiLogo';
import { Menu, X, MessageSquarePlus, ShoppingBag, UserCircle, List, History, MoreHorizontal, SlidersHorizontal, Filter, Gift, BookOpen, Send, Users, Sparkles, UtensilsCrossed } from 'lucide-react'; 
import type { Part } from "@google/genai";
import { WaiterAIResponse } from './services/chatService';

import { useAppSetup } from './hooks/useAppSetup';
import { useChatLogic } from './hooks/useChatLogic';
import { useMediaHandling } from './hooks/useMediaHandling';
import { useOrderManagement } from './hooks/useOrderManagement';

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}
interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}
declare var SpeechRecognition: any;
declare var webkitSpeechRecognition: any;

interface WelcomeSuggestion {
  text: string;
  subtitle: string;
  query: string;
  icon: React.ElementType;
}

const App: React.FC = () => {
  const {
    currentSessionId,
    isMenuSystemReady,
    allMenuItems,
    initializeSessionAndMenu,
    resetAppSessionParts,
    initializationError,
  } = useAppSetup();

  const [userName, setUserName] = useState<string | null>(null);
  const [isOnboardingComplete, setIsOnboardingComplete] = useState<boolean>(false);
  const [currentOnboardingStep, setCurrentOnboardingStep] = useState<number>(1);
  
  const {
    currentOrder,
    orderSubtotal,
    orderScheduledDateTime,
    isScheduledOrderActive,
    confirmedSchedule,
    setCurrentOrder,
    setOrderSubtotal,
    setOrderScheduledDateTime,
    setIsScheduledOrderActive,
    setConfirmedSchedule,
    handleScheduleOrderDateTimeChange,
    resetOrderState,
    updateOrderStateFromAI,
  } = useOrderManagement();
  
  const {
    messages,
    inputValue,
    isLoading,
    error : chatError,
    setMessages,
    setInputValue,
    setIsLoading,
    setError: setChatError,
    sendMessage,
    resetChatState,
  } = useChatLogic(currentSessionId, userName, initializeSessionAndMenu, currentOrder, orderSubtotal, confirmedSchedule);

  const {
    selectedFile,
    filePreview,
    handleFileChange,
    getGenerativePartsForMedia,
    clearMediaAttachments,
    resetMediaState,
    mediaError,
    setMediaError,
  } = useMediaHandling();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCustomizationModalOpen, setIsCustomizationModalOpen] = useState(false);
  const [itemToCustomize, setItemToCustomize] = useState<FullMenuItem | null>(null);
  const [isDietaryModalOpen, setIsDietaryModalOpen] = useState(false);
  const [activeDietaryPreferences, setActiveDietaryPreferences] = useState<string[]>([]);
  const [reservationDetails, setReservationDetails] = useState<WaiterAIResponse['reservationDetails'] | null>(null);
  const [currentReservationInput, setCurrentReservationInput] = useState<ReservationInputContext | null>(null); // New state for reservation flow
  const [pastOrders, setPastOrders] = useState<HistoricalOrder[]>([]);
  const [isOrderHistoryModalOpen, setIsOrderHistoryModalOpen] = useState(false);
  const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false);
  const headerMenuButtonRef = useRef<HTMLButtonElement>(null);

  const recognitionRef = useRef<any | null>(null);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const sttErrorRef = useRef<string | null>(null);

  useEffect(() => {
    const savedUserName = localStorage.getItem('guestAiUserName');
    const savedOnboardingStatus = localStorage.getItem('guestAiOnboardingComplete');
    
    if (savedUserName) {
      setUserName(savedUserName);
    }
    if (savedOnboardingStatus === 'true') {
      setIsOnboardingComplete(true);
    }
  }, []);

  const loadInitialGreeting = useCallback(() => {
    const currentHour = new Date().getHours();
    let timeBasedGreeting = "Hello";
    if (currentHour >= 5 && currentHour < 12) {
        timeBasedGreeting = "Good morning";
    } else if (currentHour >= 12 && currentHour < 18) {
        timeBasedGreeting = "Good afternoon";
    } else {
        timeBasedGreeting = "Good evening";
    }
    
    const greetingNamePart = userName ? `, ${userName}` : '';

     const initialClientMessage: WaiterAIResponse = {
        thought: "Client application loaded. Displaying initial time-based welcome screen.",
        move1: "greetGuest", 
        response: `${timeBasedGreeting}${greetingNamePart}! I'm GUEST AI, your virtual assistant. How can I help you today?`,
        currentOrder: [],
        orderSubtotal: 0,
        orderSummaryForReceipt: ""
    };
    const initialBotMsgObj = {
        id: 'initial-client-prompt', 
        text: JSON.stringify(initialClientMessage), 
        sender: SenderType.BOT,
        timestamp: new Date(),
        isRich: true, 
      };
    setMessages([initialBotMsgObj]);
    setCurrentOrder([]);
    setOrderSubtotal(0);
    setConfirmedSchedule(null);
    setReservationDetails(null);
    setCurrentReservationInput(null); // Reset reservation context on new greeting
  }, [setMessages, setCurrentOrder, setOrderSubtotal, setConfirmedSchedule, setReservationDetails, setCurrentReservationInput, userName]);

  useEffect(() => {
    const setup = async () => {
      await initializeSessionAndMenu(userName || undefined);
    };
    if (isOnboardingComplete) { 
      setup();
    }
  }, [initializeSessionAndMenu, isOnboardingComplete, userName]);

  useEffect(() => {
    if (isOnboardingComplete && isMenuSystemReady && (messages.length === 0 || (messages.length === 1 && messages[0].id === 'initial-client-prompt'))) {
      loadInitialGreeting();
    }
  }, [isMenuSystemReady, messages, loadInitialGreeting, isOnboardingComplete]);

  useEffect(() => {
    const savedPrefsString = localStorage.getItem('guestAiDietaryPreferences');
    if (savedPrefsString) {
      try {
        const savedPrefs = JSON.parse(savedPrefsString);
        if (Array.isArray(savedPrefs)) {
          setActiveDietaryPreferences(savedPrefs);
        }
      } catch (e) { console.warn("Could not parse saved dietary preferences:", e); }
    }

    const savedOrdersString = localStorage.getItem('guestAiPastOrders');
    if (savedOrdersString) {
      try {
        const savedOrders = JSON.parse(savedOrdersString) as HistoricalOrder[];
        if (Array.isArray(savedOrders)) { setPastOrders(savedOrders); }
      } catch (e) { console.warn("Could not parse saved past orders:", e); }
    }
  }, []);

  const handleSetUserName = (name: string) => {
    setUserName(name);
    localStorage.setItem('guestAiUserName', name);
  };

  const handleOnboardingComplete = async () => {
    setIsOnboardingComplete(true);
    localStorage.setItem('guestAiOnboardingComplete', 'true');
    await resetAppSessionParts(userName || undefined); 
    await initializeSessionAndMenu(userName || undefined); 
    loadInitialGreeting(); 
  };

  const handleNewChat = async () => {
    if (recognitionRef.current && isRecognizing) {
      recognitionRef.current.abort(); 
      setIsRecognizing(false);
    }
    sttErrorRef.current = null;
    await resetAppSessionParts(userName || undefined);
    resetChatState(loadInitialGreeting, isMenuSystemReady);
    resetOrderState();
    resetMediaState();
    setReservationDetails(null);
    setCurrentReservationInput(null); // Reset reservation context
    setActiveDietaryPreferences([]); 
    localStorage.removeItem('guestAiDietaryPreferences'); 
    setIsHeaderMenuOpen(false); 
  };

  const saveCurrentOrderToHistory = useCallback((confirmationCode?: string) => {
    if (currentOrder.length === 0) return;
    const newHistoricalOrder: HistoricalOrder = {
      id: `order_${Date.now()}`,
      timestamp: new Date().toISOString(),
      items: [...currentOrder],
      subtotal: orderSubtotal,
      scheduledFor: confirmedSchedule,
      confirmationCode: confirmationCode, // Save confirmation code
    };
    setPastOrders(prevOrders => {
      const updatedOrders = [newHistoricalOrder, ...prevOrders].slice(0, 20);
      localStorage.setItem('guestAiPastOrders', JSON.stringify(updatedOrders));
      return updatedOrders;
    });
  }, [currentOrder, orderSubtotal, confirmedSchedule]);
  
  const processAndSendMessage = useCallback(async (messageTextFromSuggestionOrSTT?: string) => {
    const textToSend = typeof messageTextFromSuggestionOrSTT === 'string' ? messageTextFromSuggestionOrSTT : inputValue;

    if (textToSend.trim() === '' && !selectedFile) {
      if (!isMenuSystemReady) setChatError("Menu data is not ready. Please wait or refresh.");
      return;
    }
    if (isLoading || !isMenuSystemReady || isRecognizing) return;

    let actualTextToSend = textToSend;
    if (actualTextToSend.toLowerCase() === "confirm order" && orderScheduledDateTime) {
      actualTextToSend = `Confirm order for pickup at ${orderScheduledDateTime}. My name for the order is ${userName || 'Guest'}.`;
    }

    let contextualizedTextToSend = actualTextToSend;
    // Add dietary preferences context
    if (activeDietaryPreferences.length > 0) {
      contextualizedTextToSend = `(My dietary preferences are: ${activeDietaryPreferences.join(', ')}. Please consider these for any recommendations or order items.) ${contextualizedTextToSend}`;
    }
    // Add reservation context if a reservation flow is active
    if (currentReservationInput && Object.keys(currentReservationInput).length > 0) {
      // Include user's name from profile if available and not already in context.name by AI
      const contextWithName = {
        ...currentReservationInput,
        name: currentReservationInput.name || userName || undefined
      };
      contextualizedTextToSend = `(Reservation context: ${JSON.stringify(contextWithName)}) ${contextualizedTextToSend}`;
    }


    const userMessageId = Date.now().toString();
    const userMessage: Message = {
      id: userMessageId,
      text: actualTextToSend || (selectedFile ? `File: ${selectedFile.name}` : "Processing speech..."),
      sender: SenderType.USER,
      timestamp: new Date(),
      isRich: false,
      filePreviewUrl: filePreview || undefined,
      fileName: selectedFile?.name,
      fileType: selectedFile?.type,
      activePreferences: activeDietaryPreferences.length > 0 ? [...activeDietaryPreferences] : undefined,
    };

    if (messages.length === 1 && messages[0].id === 'initial-client-prompt') {
        setMessages([userMessage]);
    } else {
        setMessages((prevMessages) => [...prevMessages, userMessage]);
    }
    
    if (typeof messageTextFromSuggestionOrSTT !== 'string') { setInputValue(''); }
        
    const mediaParts = await getGenerativePartsForMedia();
    clearMediaAttachments(); 

    setIsLoading(true);
    setChatError(null);
    sttErrorRef.current = null;

    const addOrderMatch = actualTextToSend.match(/^Add (.*?) to order$/i);
    if (addOrderMatch && addOrderMatch[1] && allMenuItems.length > 0 && mediaParts.length === 0) {
      const itemIdOrName = addOrderMatch[1];
      const item = allMenuItems.find(it => it.id === itemIdOrName || it.name.toLowerCase() === itemIdOrName.toLowerCase());
      if (item && (item.available_options?.length || item.available_modifiers?.length)) {
        if (!itemToCustomize || item.id !== itemToCustomize.id) {
          setItemToCustomize(item);
          setIsCustomizationModalOpen(true);
          setIsLoading(false);
          return;
        }
      }
    }
    
    const geminiResponse = await sendMessage(contextualizedTextToSend, mediaParts);

    if (geminiResponse) {
      // Always update order state from the top-level ChatServiceResponse fields first,
      // as these are consolidated by chatService.ts.
      // Fallback to existing app state (currentOrder, orderSubtotal) if not provided in response.
      updateOrderStateFromAI(
        geminiResponse.currentOrder || currentOrder,
        geminiResponse.orderSubtotal !== undefined ? geminiResponse.orderSubtotal : orderSubtotal,
        geminiResponse.scheduledFor,
        undefined, // _unusedConfirmedScheduleParam
        geminiResponse.orderSummaryForReceipt
      );

      // Process the textual reply and other specific fields if the reply is rich
      if (geminiResponse.reply && typeof geminiResponse.reply !== 'string') {
        const responseData = geminiResponse.reply; // This is WaiterAIResponse
        
        // Handle reservation details and interactive flow from WaiterAIResponse
        if (responseData.reservationDetails) {
          setReservationDetails(responseData.reservationDetails);
        }
        if (responseData.interactiveFlow) {
          if (responseData.interactiveFlow.step === 'askName' && userName && !responseData.interactiveFlow.currentContext?.name) {
             setCurrentReservationInput({ ...responseData.interactiveFlow.currentContext, name: userName });
          } else {
            setCurrentReservationInput(responseData.interactiveFlow.currentContext || {});
          }
          if (responseData.interactiveFlow.step === 'completed' || responseData.interactiveFlow.step === 'cancelled') {
            setCurrentReservationInput(null);
          }
        }

        // Save to history and reset UI order state on final confirmation
        if ((responseData.move1 === 'generateOrderReceipt' || responseData.move1 === 'simulateSendOrderToKitchen') && 
            (responseData.currentOrder && responseData.currentOrder.length > 0)) {
            saveCurrentOrderToHistory(responseData.confirmationCode);
            resetOrderState(); // Clear the current order from UI after saving
        }
      }
      // If geminiResponse.reply is a string, order state is already handled by the updateOrderStateFromAI call above.
    }
    setIsLoading(false);

  }, [
    inputValue, selectedFile, isMenuSystemReady, isLoading, orderScheduledDateTime, userName,
    activeDietaryPreferences, currentReservationInput, currentOrder, orderSubtotal, // Added currentOrder & orderSubtotal for fallback
    messages, allMenuItems, itemToCustomize, isRecognizing,
    setChatError, setIsLoading, setMessages, setInputValue, getGenerativePartsForMedia, clearMediaAttachments, 
    sendMessage, updateOrderStateFromAI, setReservationDetails, setCurrentReservationInput, saveCurrentOrderToHistory,
    resetOrderState
  ]);

  const handleSttMicButtonClick = useCallback(() => {
    sttErrorRef.current = null;
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      setChatError("Speech recognition is not supported by your browser.");
      return;
    }
    if (isRecognizing) {
      if (recognitionRef.current) { recognitionRef.current.stop(); }
    } else {
      recognitionRef.current = new SpeechRecognitionAPI();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';
      recognitionRef.current.onstart = () => { setIsRecognizing(true); setInputValue(''); };
      recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
        let interimTranscript = ''; let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) { finalTranscript += event.results[i][0].transcript; } 
          else { interimTranscript += event.results[i][0].transcript; }
        }
        setInputValue(finalTranscript || interimTranscript);
      };
      recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error', event.error);
        let errorMsg = `Speech recognition error: ${event.error}.`;
        if (event.error === 'no-speech') errorMsg = "No speech detected. Please try again.";
        if (event.error === 'audio-capture') errorMsg = "Microphone error. Please check your microphone.";
        if (event.error === 'not-allowed') errorMsg = "Microphone access denied. Please enable it in browser settings.";
        sttErrorRef.current = errorMsg; setChatError(errorMsg); setIsRecognizing(false);
      };
      recognitionRef.current.onend = () => {
        setIsRecognizing(false);
        if (inputValue.trim() && sttErrorRef.current !== "Microphone access denied. Please enable it in browser settings." && sttErrorRef.current !== "Microphone error. Please check your microphone.") {
          processAndSendMessage(inputValue);
        }
      };
      recognitionRef.current.start();
    }
  }, [isRecognizing, setInputValue, processAndSendMessage, setChatError, inputValue]);

  const handleOpenCustomizationModal = (item: FullMenuItem) => {
    setItemToCustomize(item);
    setIsCustomizationModalOpen(true);
  };

  const handleConfirmCustomization = (
    item: FullMenuItem, quantity: number, selectedOptions: OrderItemOption[], appliedModifiers: OrderItemModifier[]
  ) => {
    setIsCustomizationModalOpen(false); setItemToCustomize(null);
    let optionsString = selectedOptions.length > 0 ? " with options: " + selectedOptions.map(opt => `${opt.option_name}=${opt.value}`).join(', ') : "";
    let modifiersString = appliedModifiers.length > 0 ? " and modifiers: " + appliedModifiers.map(mod => `${mod.mod_name}`).join(', ') : "";
    const messageToAI = `Add ${item.id} (x${quantity}) to order${optionsString}${modifiersString}.`;
    processAndSendMessage(messageToAI);
  };

  const handleSuggestionClick = (suggestion: string) => {
    if (!isOnboardingComplete) return;
    
    // If suggestion is part of an interactive flow, let processAndSendMessage handle context
    if (!suggestion.toLowerCase().includes(" step: ") && !suggestion.toLowerCase().includes(" expectsinput: true")) { // Avoid clearing context for flow steps
        // setCurrentReservationInput(null); // Decided against auto-clearing for generic suggestions for now.
    }

    const addOrderMatch = suggestion.match(/^Add (.*?) to order$/i);
    if (addOrderMatch && addOrderMatch[1] && allMenuItems.length > 0) {
      const itemIdOrName = addOrderMatch[1];
      const item = allMenuItems.find(it => it.id === itemIdOrName || it.name.toLowerCase() === itemIdOrName.toLowerCase());
      if (item && (item.available_options?.length || item.available_modifiers?.length)) {
        handleOpenCustomizationModal(item);
        return;
      }
    }
    processAndSendMessage(suggestion);
  };

  const handleSaveDietaryPreferences = (preferences: string[]) => {
    setActiveDietaryPreferences(preferences);
    localStorage.setItem('guestAiDietaryPreferences', JSON.stringify(preferences));
    setIsDietaryModalOpen(false);
  };

  const handleReorder = useCallback((orderId: string) => {
    const orderToReorder = pastOrders.find(o => o.id === orderId);
    if (orderToReorder) {
      setCurrentOrder([...orderToReorder.items]);
      setOrderSubtotal(orderToReorder.subtotal);
      if (orderToReorder.scheduledFor) {
        setOrderScheduledDateTime(orderToReorder.scheduledFor);
        setIsScheduledOrderActive(true); setConfirmedSchedule(null); 
      } else {
        setOrderScheduledDateTime(null); setIsScheduledOrderActive(false); setConfirmedSchedule(null);
      }
      // Note: Confirmation code from historical order is not directly re-used for a new order.
      // A new code will be generated if this re-order is confirmed.
      setIsOrderHistoryModalOpen(false); setIsSidebarOpen(true); 
    }
  }, [pastOrders, setCurrentOrder, setOrderSubtotal, setOrderScheduledDateTime, setIsScheduledOrderActive, setConfirmedSchedule]);
  
  if (!isOnboardingComplete) {
    return (
      <OnboardingFlow
        currentStep={currentOnboardingStep}
        setCurrentStep={setCurrentOnboardingStep}
        userName={userName}
        onSetUserName={handleSetUserName}
        onOnboardingComplete={handleOnboardingComplete}
      />
    );
  }
  
  const showWelcomeScreen = isMenuSystemReady && messages.length === 1 && messages[0].id === 'initial-client-prompt' && !isLoading && !isRecognizing;

  if ((!isMenuSystemReady && !initializationError) || (!isMenuSystemReady && !chatError && !initializationError)) {
    return (
      <div className="flex h-screen bg-brand-bg-dark text-brand-text-primary items-center justify-center">
        <div className="text-center">
          <GuestAiLogo size={80} className="mx-auto mb-4" />
          <p className="text-lg text-brand-text-secondary">Initializing GUEST AI...</p>
        </div>
      </div>
    );
  }
  
  const currentCombinedError = chatError || mediaError || initializationError;

  const welcomeSuggestions: WelcomeSuggestion[] = [
    { text: "View Full Menu", subtitle: "Browse all our dishes & drinks", query: "Show me the full menu", icon: BookOpen },
    { text: "Specials & Deals", subtitle: "Check out unique daily offers", query: "What are today's specials?", icon: Sparkles },
    { text: "Book a Table", subtitle: "Reserve your spot with us", query: "I'd like to book a table", icon: Users }, 
    { text: "Recommendation", subtitle: "Get a tailored suggestion", query: "Surprise me with a recommendation!", icon: Gift },
  ];

  return (
    <div className="flex h-screen bg-brand-bg-dark text-brand-text-primary">
      <OrderSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        currentOrder={currentOrder}
        orderSubtotal={orderSubtotal}
        onConfirmOrder={() => processAndSendMessage("confirm order")}
        isScheduledOrderActive={isScheduledOrderActive}
        scheduledDateTime={orderScheduledDateTime}
        onScheduleOrderDateTimeChange={handleScheduleOrderDateTimeChange}
        confirmedSchedule={confirmedSchedule}
      />

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="bg-brand-surface-dark p-3 flex items-center justify-between border-b border-brand-border sticky top-0 z-20">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-md hover:bg-brand-surface-light text-brand-text-secondary focus:outline-none focus:ring-2 focus:ring-brand-primary active:scale-95 transition-transform"
              aria-label={isSidebarOpen ? "Close order/menu sidebar" : "Open order/menu sidebar"}
            >
              {isSidebarOpen ? <X size={20} /> : <List size={20} />}
            </button>
            <div className="flex items-center space-x-2">
              <GuestAiLogo size={32} />
              <div className="flex flex-col items-start">
                <h1 className="text-lg font-semibold text-brand-text-primary leading-tight">GUEST AI</h1>
                <span className="text-[0.6rem] text-brand-text-secondary/70 leading-tight -mt-0.5">by W3JDEV™</span>
              </div>
            </div>
            {userName && <span className="text-sm text-brand-text-secondary hidden sm:inline">Hi, {userName}!</span>}
          </div>
          <div className="flex items-center space-x-1 sm:space-x-2">
            <button
              onClick={() => setIsDietaryModalOpen(true)}
              className="p-2 rounded-md hover:bg-brand-surface-light text-brand-text-secondary focus:outline-none focus:ring-2 focus:ring-brand-primary relative active:scale-95 transition-transform"
              aria-label="Set dietary preferences"
              disabled={!isMenuSystemReady || isLoading || isRecognizing}
            >
              <SlidersHorizontal size={20} />
              {activeDietaryPreferences.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-primary"></span>
                </span>
              )}
            </button>
            <button
              onClick={() => setIsOrderHistoryModalOpen(true)}
              className="p-2 rounded-md hover:bg-brand-surface-light text-brand-text-secondary focus:outline-none focus:ring-2 focus:ring-brand-primary active:scale-95 transition-transform"
              aria-label="View order history"
              disabled={!isMenuSystemReady}
            >
              <History size={20} />
            </button>
            <div className="relative">
              <button
                ref={headerMenuButtonRef}
                onClick={() => setIsHeaderMenuOpen(prev => !prev)}
                className="p-2 rounded-md hover:bg-brand-surface-light text-brand-text-secondary focus:outline-none focus:ring-2 focus:ring-brand-primary active:scale-95 transition-transform"
                aria-label="More options"
                aria-haspopup="true"
                aria-expanded={isHeaderMenuOpen}
              >
                <MoreHorizontal size={20} />
              </button>
              {isHeaderMenuOpen && (
                <HeaderActionMenu
                  onClose={() => setIsHeaderMenuOpen(false)}
                  onNewChat={handleNewChat}
                  anchorEl={headerMenuButtonRef.current}
                />
              )}
            </div>
          </div>
        </header>

        {activeDietaryPreferences.length > 0 && (
          <div className="bg-brand-primary/10 text-brand-primary text-xs py-1.5 px-4 text-center border-b border-brand-border flex items-center justify-center space-x-2">
            <Filter size={12} />
            <span>Active Preferences: {activeDietaryPreferences.join(', ')}. <button onClick={() => setIsDietaryModalOpen(true)} className="font-semibold hover:underline active:scale-95 transition-transform">Edit</button></span>
          </div>
        )}

        {showWelcomeScreen ? (
          <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 text-center bg-brand-bg-dark">
            <div className="max-w-xl w-full">
              <div className="flex justify-center mb-6">
                <GuestAiLogo size={72} />
              </div>
              <h2 className="text-2xl sm:text-3xl font-semibold text-brand-text-primary mb-2">
                {userName ? `Welcome back, ${userName}!` : "Welcome to GUEST AI!"}
              </h2>
              <p className="text-brand-text-secondary mb-8 text-sm sm:text-base">
                Your virtual assistant for Table & Apron. How can I assist you?
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {welcomeSuggestions.map((suggestion) => (
                  <WelcomeSuggestionCard
                    key={suggestion.text}
                    icon={suggestion.icon}
                    text={suggestion.text}
                    subtitle={suggestion.subtitle}
                    onClick={() => handleSuggestionClick(suggestion.query)}
                  />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <MessageList
            messages={messages}
            onSuggestionClick={handleSuggestionClick}
            allMenuItems={allMenuItems}
            confirmedSchedule={confirmedSchedule}
            reservationDetails={reservationDetails} 
            isLoading={isLoading || isRecognizing} 
          />
        )}

        {currentCombinedError && (
          <div className="p-3 bg-brand-error/20 text-brand-error text-sm text-center" role="alert">
            {currentCombinedError}
          </div>
        )}

        <MessageInput
          inputValue={inputValue}
          onInputChange={(e) => setInputValue(e.target.value)}
          onSendMessage={() => processAndSendMessage()}
          isLoading={isLoading || !isMenuSystemReady || isRecognizing}
          isRecording={isRecognizing}
          onMicClick={handleSttMicButtonClick}
          onFileChange={handleFileChange}
          selectedFile={selectedFile}
          filePreview={filePreview}
          recordedAudioBlob={null}
          clearAttachments={clearMediaAttachments}
        />
      </div>
      
      <CustomizationModal
        item={itemToCustomize}
        isOpen={isCustomizationModalOpen && itemToCustomize !== null}
        onClose={() => { setIsCustomizationModalOpen(false); }}
        onConfirm={handleConfirmCustomization}
      />
      
      <DietaryPreferencesModal
        isOpen={isDietaryModalOpen}
        onClose={() => setIsDietaryModalOpen(false)}
        currentPreferences={activeDietaryPreferences}
        onSavePreferences={handleSaveDietaryPreferences}
      />

      <OrderHistoryModal
        isOpen={isOrderHistoryModalOpen}
        onClose={() => setIsOrderHistoryModalOpen(false)}
        pastOrders={pastOrders}
        onReorder={handleReorder}
      />
    </div>
  );
};

export default App;