import React from 'react';
import { Message, SenderType, FullMenuItem } from '../types';
import { WaiterAIResponse } from '../services/chatService';
import { UserCircle, Paperclip, FileText, AudioWaveform } from 'lucide-react';
import { GuestAiLogo } from './GuestAiLogo';
import { BotGeneralMessageDisplay } from './botResponses/BotGeneralMessageDisplay';
import { BotMenuOptionsDisplay } from './botResponses/BotMenuOptionsDisplay';
import { BotCategoryItemsDisplay } from './botResponses/BotCategoryItemsDisplay';
import { BotReservationFlowHandler } from './botResponses/interactive/BotReservationFlowHandler'; // Added

interface ChatMessageDisplayProps {
  message: Message;
  onSuggestionClick: (suggestion: string) => void;
  allMenuItems: FullMenuItem[];
  confirmedSchedule: string | null;
  reservationDetails: WaiterAIResponse['reservationDetails'] | null; // Ensure this prop is passed down if needed by BotGeneralMessageDisplay
}

const formatUserText = (text: string | undefined): string => {
  if (!text) return '';
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>');
};

export const ChatMessageDisplay: React.FC<ChatMessageDisplayProps> = ({
  message,
  onSuggestionClick,
  allMenuItems,
  confirmedSchedule,
  reservationDetails,
}) => {
  const isUser = message.sender === SenderType.USER;

  if (message.sender === SenderType.BOT && message.isRich) {
    try {
      const waiterResponse = JSON.parse(message.text) as WaiterAIResponse;

      // Special handling for listCategoryItems to achieve open layout for cards
      if (waiterResponse.move1 === 'listCategoryItems' && waiterResponse.response && allMenuItems.length > 0) {
        const itemListingPattern = /(\n\s*(\*|-|\d+\.)\s*[\w\s&']+?\s*\(ID:[\s\S]*)/i;
        const matchResult = waiterResponse.response.split(itemListingPattern);
        let introText = '';
        let restOfResponseForCards = waiterResponse.response;

        if (matchResult && matchResult.length > 1 && matchResult[0].trim().length > 0) {
            const potentialIntro = matchResult[0].trim();
            if (potentialIntro.length > 10 && (potentialIntro.endsWith('.') || potentialIntro.endsWith(':') || potentialIntro.includes('are the items'))) {
                 introText = potentialIntro;
                 restOfResponseForCards = waiterResponse.response.substring(potentialIntro.length).trim();
            }
        } else if (!waiterResponse.response.match(/^(\*|-|\d+\.)/)) { 
            const sentences = waiterResponse.response.split(/([.?!])\s+/);
            if (sentences.length > 2) {
                const firstSentence = (sentences[0] + (sentences[1] || '')).trim();
                if (firstSentence.length < 150 && !allMenuItems.some(item => firstSentence.toLowerCase().includes(item.name.toLowerCase().substring(0,10)))) {
                    introText = firstSentence;
                    restOfResponseForCards = waiterResponse.response.substring(firstSentence.length).trim();
                }
            }
        }
        
        const modifiedWaiterResponseForCards = { ...waiterResponse, response: restOfResponseForCards };

        return (
          <>
            {introText && (
              <div className="flex items-end w-full justify-start mb-2">
                <GuestAiLogo
                  size={28}
                  className="mr-2 self-start p-0.5 bg-brand-surface-light rounded-full shadow-subtle flex-shrink-0 flex items-center justify-center"
                />
                <div
                  className="max-w-[85%] sm:max-w-[75%] p-3 sm:p-4 rounded-xl shadow-subtle text-sm bg-brand-bot-message-bg text-brand-text-primary rounded-bl-none"
                >
                  <p className="text-sm text-brand-text-primary" dangerouslySetInnerHTML={{ __html: formatUserText(introText).replace(/\n/g, '<br />') }} />
                </div>
              </div>
            )}
            <BotCategoryItemsDisplay
              waiterResponse={modifiedWaiterResponseForCards}
              allMenuItems={allMenuItems}
              onSuggestionClick={onSuggestionClick}
            />
          </>
        );
      }

      // Standard rendering for other bot messages
      let contentToDisplay;
      if (waiterResponse.move1 === 'presentMenuOptions' && waiterResponse.response) {
        contentToDisplay = (
          <BotMenuOptionsDisplay
            responseText={waiterResponse.response}
            onSuggestionClick={onSuggestionClick}
          />
        );
      } else {
        contentToDisplay = (
          <BotGeneralMessageDisplay
            waiterResponse={waiterResponse} // This now includes potential interactiveFlow
            allMenuItems={allMenuItems}
            onSuggestionClick={onSuggestionClick}
            confirmedSchedule={confirmedSchedule}
            reservationDetails={reservationDetails} // Pass this down for consistency
          />
        );
      }
      
      // New: Check for interactiveFlow AFTER general display is determined
      let interactiveFlowDisplay = null;
      if (waiterResponse.interactiveFlow) {
        interactiveFlowDisplay = (
          <BotReservationFlowHandler
            interactiveFlowData={waiterResponse.interactiveFlow}
            onSuggestionClick={onSuggestionClick}
          />
        );
      }

      return (
        <div className="flex items-end w-full justify-start">
          <GuestAiLogo
            size={28}
            className="mr-2 self-start p-0.5 bg-brand-surface-light rounded-full shadow-subtle flex-shrink-0 flex items-center justify-center"
          />
          <div
            className="max-w-[85%] sm:max-w-[75%] p-3 sm:p-4 rounded-xl shadow-subtle text-sm bg-brand-bot-message-bg text-brand-text-primary rounded-bl-none w-full" // Added w-full for handler
          >
            {contentToDisplay}
            {interactiveFlowDisplay} {/* Render interactive flow below general content */}
          </div>
        </div>
      );

    } catch (e) {
      console.warn("Failed to parse WaiterAIResponse content:", e, message.text);
      return ( 
        <div className="flex items-end w-full justify-start">
          <GuestAiLogo
            size={28}
            className="mr-2 self-start p-0.5 bg-brand-surface-light rounded-full shadow-subtle flex-shrink-0 flex items-center justify-center"
          />
          <div className="max-w-[85%] sm:max-w-[75%] p-3 sm:p-4 rounded-xl shadow-subtle text-sm bg-brand-bot-message-bg text-brand-text-primary rounded-bl-none">
            <p className="text-sm text-brand-error">Error: Could not display bot message content.</p>
            <p className="text-xs text-brand-text-secondary mt-1">Raw: {message.text.substring(0,100)}...</p>
          </div>
        </div>
      );
    }
  } else {
    // User message display
    const contentToDisplay = (
      <div className="space-y-2">
        {message.filePreviewUrl && message.fileType?.startsWith('image/') && (
          <img src={message.filePreviewUrl} alt={message.fileName || "Uploaded image"} className="max-w-xs max-h-48 rounded-lg border border-brand-border" />
        )}
        {message.fileName && !message.fileType?.startsWith('image/') && (
          <div className="flex items-center space-x-2 p-2 bg-brand-surface-light rounded-md text-xs">
            {message.fileType?.startsWith('text/') ? <FileText size={16} className="text-brand-text-secondary" /> : <Paperclip size={16} className="text-brand-text-secondary" />}
            <span className="text-brand-text-secondary truncate">{message.fileName}</span>
          </div>
        )}
        {message.audioUrl && (
          <audio controls src={message.audioUrl} className="w-full h-10 my-1">
            Your browser does not support the audio element.
          </audio>
        )}
        {message.text && <p className="text-sm text-brand-text-primary" dangerouslySetInnerHTML={{ __html: formatUserText(message.text).replace(/\n/g, '<br />') }} />}
      </div>
    );
     return (
        <div className={`flex items-end w-full ${isUser ? 'justify-end' : 'justify-start'}`}>
          {!isUser && ( 
            <GuestAiLogo
              size={28}
              className="mr-2 self-start p-0.5 bg-brand-surface-light rounded-full shadow-subtle flex-shrink-0 flex items-center justify-center"
            />
          )}
          <div
            className={`max-w-[85%] sm:max-w-[75%] p-3 sm:p-4 rounded-xl shadow-subtle text-sm ${
              isUser
                ? 'bg-brand-user-message-bg text-brand-text-primary rounded-br-none ml-auto'
                : 'bg-brand-bot-message-bg text-brand-text-primary rounded-bl-none' 
            } `}
          >
            {contentToDisplay}
          </div>
          {isUser && (
            <UserCircle size={32} className="text-brand-secondary ml-2 self-start p-0.5 bg-brand-surface-light rounded-full shadow-subtle flex-shrink-0" />
          )}
        </div>
      );
  }
};