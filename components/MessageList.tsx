
import React, { useEffect, useRef } from 'react';
import { Message, SenderType, FullMenuItem } from '../types';
import { ChatMessageDisplay } from './ChatMessageDisplay';
import { WaiterAIResponse } from '../services/chatService'; // For reservationDetails type
import { GuestAiLogo } from './GuestAiLogo';


interface MessageListProps {
  messages: Message[];
  onSuggestionClick: (suggestion: string) => void;
  allMenuItems: FullMenuItem[];
  confirmedSchedule: string | null; 
  reservationDetails: WaiterAIResponse['reservationDetails'] | null;
  isLoading: boolean;
}

export const MessageList: React.FC<MessageListProps> = ({ messages, onSuggestionClick, allMenuItems, confirmedSchedule, reservationDetails, isLoading }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  };

  useEffect(() => {
    setTimeout(scrollToBottom, 100);
  }, [messages, isLoading]); // Added isLoading to dependencies to scroll after typing indicator appears/disappears

  const displayMessages = messages.filter(msg => {
    if (msg.id === 'initial-client-prompt' && messages.length > 1) {
      return false;
    }
    return true;
  });

  const showTypingIndicator = isLoading && displayMessages.length > 0 && displayMessages[displayMessages.length - 1].sender === SenderType.USER;


  return (
    <div className="flex-grow p-4 sm:p-6 space-y-4 overflow-y-auto bg-brand-bg-dark">
      {displayMessages.map((msg) => (
        <ChatMessageDisplay 
            key={msg.id} 
            message={msg} 
            onSuggestionClick={onSuggestionClick} 
            allMenuItems={allMenuItems}
            confirmedSchedule={confirmedSchedule} 
            reservationDetails={reservationDetails}
        />
      ))}
      {showTypingIndicator && (
        <div className="flex items-end w-full justify-start">
          <GuestAiLogo
            size={28}
            className="mr-2 self-start p-0.5 bg-brand-surface-light rounded-full shadow-subtle flex-shrink-0 flex items-center justify-center"
          />
          <div
            className="max-w-[85%] sm:max-w-[75%] p-3 sm:p-4 rounded-xl shadow-subtle text-sm bg-brand-bot-message-bg text-brand-text-primary rounded-bl-none"
            aria-live="polite" 
            aria-label="GUEST AI is typing"
          >
            <div className="flex space-x-1.5 items-center h-4"> {/* Added h-4 for alignment */}
                <span className="h-2 w-2 bg-brand-text-secondary rounded-full typing-dot"></span>
                <span className="h-2 w-2 bg-brand-text-secondary rounded-full typing-dot"></span>
                <span className="h-2 w-2 bg-brand-text-secondary rounded-full typing-dot"></span>
            </div>
          </div>
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};