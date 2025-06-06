
import React from 'react';
import { FullMenuItem, OrderItem, OrderItemOption, OrderItemModifier } from '../../types';
import { WaiterAIResponse } from '../../services/chatService';
import { DetailedMenuItemCard } from '../DetailedMenuItemCard';
import { MenuItemCard } from '../MenuItemCard';
import { SuggestionButton } from '../SuggestionButton';
import { ContactActionsCard } from './ContactActionsCard'; // Added
import { CalendarClock, CheckSquare, MessageCircleQuestion, CalendarDays, Clock, Users, Edit3, Phone, UserCircle, Info } from 'lucide-react';

const formatText = (text: string | undefined): string => {
  if (!text) return '';
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>');
};

const formatOrderOptions = (options: OrderItemOption[]): string => {
  if (!options || options.length === 0) return '';
  return options.map(opt => `${opt.option_name}: ${opt.value}`).join(', ');
};

const formatOrderModifiers = (modifiers: OrderItemModifier[]): string => {
  if (!modifiers || modifiers.length === 0) return '';
  return modifiers.map(mod => `${mod.mod_name}${mod.price_change !== 0 ? ` (${mod.price_change > 0 ? '+' : ''}RM${mod.price_change.toFixed(2)})` : ''}`).join(', ');
};

const getSuggestionsFromResponse = (
    waiterResponse: WaiterAIResponse, 
    onSuggestionClick: (suggestion: string) => void
  ): JSX.Element[] => {
  const suggestions: JSX.Element[] = [];
  const responseText = waiterResponse.response;
  if (!responseText) return suggestions;

  const lowerResponse = responseText.toLowerCase();

  if (waiterResponse.move1 === 'generateOrderReceipt' || waiterResponse.move1 === 'simulateSendOrderToKitchen' || waiterResponse.move1 === 'confirmReservationSimulated') {
    if (lowerResponse.includes("share how your experience was") || lowerResponse.includes("your feedback") || lowerResponse.includes("feel free to let me know")) {
        suggestions.push(<SuggestionButton key="sg-leavefeedback" text="Share Feedback" onClick={() => onSuggestionClick("I'd like to share feedback.")} variant="secondary" />);
    }
    // If a confirmation code is present, primary action is done, so fewer general suggestions.
    if (waiterResponse.confirmationCode) {
        suggestions.push(<SuggestionButton key="sg-menu" text="Back to Menu" onClick={() => onSuggestionClick("Show menu categories")} variant="secondary" />);
        return suggestions.slice(0, 2);
    }
  }

  // Check for interactive flow confirmation step
  if (waiterResponse.interactiveFlow?.step === 'askConfirmation') {
    // Suggestions for interactive flow are handled by BotReservationFlowHandler
    return []; 
  }


  if (lowerResponse.includes("confirm this order?") || lowerResponse.includes("confirm your order?") || lowerResponse.includes("shall i confirm")) {
    suggestions.push(<SuggestionButton key="sg-confirm" text="Yes, confirm" onClick={() => onSuggestionClick("Yes, confirm order")} variant="primary"/>);
  }
  if (lowerResponse.includes("anything else?")) {
     suggestions.push(<SuggestionButton key="sg-viewmenu" text="Menu Categories" onClick={() => onSuggestionClick("Show menu categories")} />);
  }
   if (suggestions.length === 0 && (lowerResponse.includes("how can i help") || lowerResponse.includes("what can i get for you"))) {
    suggestions.push(<SuggestionButton key="sg-recommend" text="Recommend something" onClick={() => onSuggestionClick("Can you recommend something popular?")} />);
    suggestions.push(<SuggestionButton key="sg-booktable" text="Book a table" onClick={() => onSuggestionClick("I'd like to book a table")} />);
  }
  return suggestions.slice(0, 3); 
};

const findDetailedItemInResponse = (responseText: string | undefined, currentAllMenuItems: FullMenuItem[]): FullMenuItem | null => {
  if (!responseText || !currentAllMenuItems || currentAllMenuItems.length === 0) return null;
  const detailMatch = responseText.match(/(?:details for|here is|here's|more about) \*\*(.*?)\*\*/i);
  if (detailMatch && detailMatch[1]) {
    const matchedItemName = detailMatch[1].trim();
    const foundItem = currentAllMenuItems.find(item => 
        item.name.toLowerCase() === matchedItemName.toLowerCase() || 
        item.id.toLowerCase() === matchedItemName.toLowerCase()
    );
    if (foundItem) return foundItem;
  }
  
  const mentionedItems = currentAllMenuItems
    .filter(item => {
        const nameInResponse = responseText.toLowerCase().includes(item.name.toLowerCase());
        const idInResponse = responseText.toLowerCase().includes(item.id.toLowerCase());
        return nameInResponse || idInResponse;
    })
    .sort((a, b) => b.name.length - a.name.length); 

  if (mentionedItems.length > 0) {
    const firstMentioned = mentionedItems[0];
    const isDetailedContext = 
        responseText.toLowerCase().startsWith(`here are the details for ${firstMentioned.name.toLowerCase()}`) ||
        responseText.toLowerCase().startsWith(`here are the details for ${firstMentioned.id.toLowerCase()}`) ||
        (responseText.toLowerCase().includes(firstMentioned.name.toLowerCase()) && responseText.length < firstMentioned.name.length + 70); 

    if (isDetailedContext) { return firstMentioned; }
  }
  return null;
};

interface BotGeneralMessageDisplayProps {
  waiterResponse: WaiterAIResponse;
  allMenuItems: FullMenuItem[];
  onSuggestionClick: (suggestion: string) => void;
  confirmedSchedule: string | null;
  reservationDetails: WaiterAIResponse['reservationDetails'] | null;
}

export const BotGeneralMessageDisplay: React.FC<BotGeneralMessageDisplayProps> = ({
  waiterResponse,
  allMenuItems,
  onSuggestionClick,
  confirmedSchedule,
  reservationDetails, 
}) => {
  const suggestions = getSuggestionsFromResponse(waiterResponse, onSuggestionClick);
  
  let detailedItemFromResponse: FullMenuItem | null = null;
  if (waiterResponse.move1 !== 'presentMenuOptions' && 
      waiterResponse.move1 !== 'listCategoryItems' && 
      !waiterResponse.orderSummaryForReceipt &&
      waiterResponse.move1 !== 'confirmReservationSimulated' && 
      !waiterResponse.confirmationCode && // Don't show item card if confirmation code is present
      waiterResponse.interactiveFlow?.type !== 'reservation' && 
      waiterResponse.move1 !== 'acknowledgeFeedbackPrompt' &&
      waiterResponse.move1 !== 'handleUserFeedback' &&    
      (waiterResponse.move1 === 'describeDishOrDrink' || waiterResponse.move1 === 'makeRecommendation' || (waiterResponse.response && waiterResponse.response.length < 250))) { 
      detailedItemFromResponse = findDetailedItemInResponse(waiterResponse.response, allMenuItems);
  }

  const showCurrentOrderInChat = waiterResponse.currentOrder && waiterResponse.currentOrder.length > 0 &&
    ['takeOrderItem', 'handleModifierOrOption', 'confirmOrder'].includes(waiterResponse.move1) && !waiterResponse.confirmationCode;

  const showOrderReceiptInChat = waiterResponse.orderSummaryForReceipt && waiterResponse.orderSummaryForReceipt.length > 0 &&
    ['generateOrderReceipt', 'simulateSendOrderToKitchen'].includes(waiterResponse.move1);

  let scheduleDisplay: JSX.Element | null = null;
  const scheduleToDisplay = waiterResponse.scheduledFor || (showOrderReceiptInChat ? confirmedSchedule : null);
  if (scheduleToDisplay) {
    const scheduleDate = new Date(scheduleToDisplay);
    const formattedSchedule = isNaN(scheduleDate.getTime()) ? scheduleToDisplay : scheduleDate.toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
    scheduleDisplay = (
      <div className="mt-2 flex items-center text-xs text-brand-secondary">
        <CalendarClock size={14} className="mr-1.5 opacity-80" /> Scheduled for: {formattedSchedule}
      </div>
    );
  }

  let reservationDisplayFromContext: JSX.Element | null = null;
  const resDetailsToUse = waiterResponse.reservationDetails || reservationDetails; 

  if (resDetailsToUse && (waiterResponse.move1 === 'confirmReservationSimulated' || waiterResponse.interactiveFlow?.step === 'askConfirmation' || waiterResponse.interactiveFlow?.step === 'completed')) {
    const res = resDetailsToUse;
    const isCompleted = waiterResponse.interactiveFlow?.step === 'completed' || waiterResponse.confirmationCode;
    const statusText = isCompleted ? 'Reservation Confirmed (Provisional)' : 'Review Your Reservation:';
    const statusIcon = isCompleted ? <CheckSquare size={16} className="mr-2 text-green-400" /> : <Info size={16} className="mr-2 text-brand-primary" />;
    
    let dateStr = res.date;
    try {
        if (res.date && !isNaN(new Date(res.date).getTime())) {
            dateStr = new Date(res.date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
        }
    } catch (e) { /* keep original string if parsing fails */ }


    reservationDisplayFromContext = (
      <div className="mt-2 p-3 bg-brand-surface-light rounded-lg border border-brand-border/50 shadow-sm">
        <div className="flex items-center text-sm font-semibold text-brand-text-primary mb-2">
          {statusIcon} {statusText}
        </div>
        <div className="space-y-1 text-xs">
          {res.name && (
            <div className="flex items-center"><UserCircle size={14} className="mr-2 text-brand-text-secondary" />Name: <span className="font-medium ml-1">{res.name}</span></div>
          )}
          <div className="flex items-center"><Users size={14} className="mr-2 text-brand-text-secondary" />Guests: <span className="font-medium ml-1">{res.guests}</span></div>
          <div className="flex items-center"><CalendarDays size={14} className="mr-2 text-brand-text-secondary" />Date: <span className="font-medium ml-1">{dateStr}</span></div>
          <div className="flex items-center"><Clock size={14} className="mr-2 text-brand-text-secondary" />Time: <span className="font-medium ml-1">{res.time}</span></div>
          {res.phone && (
            <div className="flex items-center"><Phone size={14} className="mr-2 text-brand-text-secondary" />Phone: <span className="font-medium ml-1">{res.phone}</span></div>
          )}
          {res.notes && (
            <div className="flex items-start"><Edit3 size={14} className="mr-2 mt-0.5 text-brand-text-secondary flex-shrink-0" />Notes: <span className="font-medium ml-1 italic">{res.notes}</span></div>
          )}
        </div>
      </div>
    );
  }

  const isFeedbackAcknowledgement = waiterResponse.move1 === 'acknowledgeFeedbackPrompt';

  const restaurantPhoneNumber = "+60123456789"; // Restaurant's call number
  const restaurantWhatsAppNumber = "60123456789"; // Restaurant's WhatsApp number (international, no '+')

  return (
    <div className="space-y-3">
      {waiterResponse.response && (
        <div className="flex items-start space-x-2">
            {isFeedbackAcknowledgement && <MessageCircleQuestion size={24} className="text-brand-primary flex-shrink-0 mt-0.5" />}
            <div
                className="text-sm text-brand-text-primary"
                dangerouslySetInnerHTML={{ __html: formatText(waiterResponse.response).replace(/\n/g, '<br />') }}
            />
        </div>
      )}

      {waiterResponse.confirmationCode && (
        <div className="mt-2 p-3 bg-brand-primary/10 rounded-lg border border-brand-primary/30 shadow-sm">
            <p className="text-sm font-semibold text-brand-primary">
                Confirmation Code: <strong className="text-brand-secondary">{waiterResponse.confirmationCode}</strong>
            </p>
        </div>
      )}

      {reservationDisplayFromContext} 
      {detailedItemFromResponse && !reservationDisplayFromContext && !waiterResponse.confirmationCode && ( 
        <DetailedMenuItemCard item={detailedItemFromResponse} onSuggestionClick={onSuggestionClick} />
      )}
      
      {showCurrentOrderInChat && waiterResponse.currentOrder && (
        <div className="mt-3 pt-3 border-t border-brand-border">
          <h4 className="text-sm font-semibold mb-2 text-brand-text-primary">Your Current Order:</h4>
          {scheduleDisplay}
          <div className="space-y-2 mt-1">
            {waiterResponse.currentOrder.map((orderItem: OrderItem, index: number) => {
              const itemDescriptionParts = [];
              const optionsString = formatOrderOptions(orderItem.selected_options);
              if (optionsString) itemDescriptionParts.push(`Options: ${optionsString}`);
              const modifiersString = formatOrderModifiers(orderItem.applied_modifiers);
              if (modifiersString) itemDescriptionParts.push(`Modifiers: ${modifiersString}`);
              const fullMenuItemDetails = allMenuItems.find(i => i.id === orderItem.item_id);
              const itemForCard: FullMenuItem = {
                id: orderItem.item_id, name: orderItem.item_name, price: orderItem.base_price,
                description: itemDescriptionParts.length > 0 ? itemDescriptionParts.join('. ') : (fullMenuItemDetails?.description || 'Standard selection'),
                imageUrl: fullMenuItemDetails?.imageUrl || '', category: fullMenuItemDetails?.category || 'Unknown',
                ingredients: fullMenuItemDetails?.ingredients || [], allergens: fullMenuItemDetails?.allergens || [],
                dietary_tags: fullMenuItemDetails?.dietary_tags || [], displayTags: fullMenuItemDetails?.displayTags || [],
                available_options: fullMenuItemDetails?.available_options || [], available_modifiers: fullMenuItemDetails?.available_modifiers || [],
              };
              return (
                <MenuItemCard
                  key={`${orderItem.item_id}-${index}-${orderItem.selected_options.map(o => o.value).join('-')}`}
                  item={itemForCard}
                  onSuggestionClick={onSuggestionClick}
                  isOrderContext={true}
                  quantity={orderItem.quantity}
                  totalItemPrice={orderItem.final_item_price}
                  isSpicy={fullMenuItemDetails?.displayTags?.some(t=>t.toLowerCase()==='spicy') || fullMenuItemDetails?.allergens?.some(a=>a.toLowerCase()==='chili')}
                />
              );
            })}
          </div>
          <p className="text-right font-semibold text-sm mt-2 text-brand-text-primary">
            Subtotal: RM {waiterResponse.orderSubtotal?.toFixed(2) || '0.00'}
          </p>
        </div>
      )}

      {showOrderReceiptInChat && waiterResponse.orderSummaryForReceipt && (
        <div className="mt-3 pt-3 border-t border-brand-border">
          <h4 className="text-sm font-semibold mb-1 text-brand-text-primary">Order Confirmed:</h4>
          {scheduleDisplay}
          <pre className="p-3 bg-brand-surface-light rounded-md text-xs whitespace-pre-wrap font-mono shadow-inner overflow-x-auto text-brand-text-secondary mt-1">
            {waiterResponse.orderSummaryForReceipt}
          </pre>
        </div>
      )}
      
      {waiterResponse.confirmationCode && (
        <ContactActionsCard 
            restaurantPhoneNumber={restaurantPhoneNumber} 
            restaurantWhatsAppNumber={restaurantWhatsAppNumber} 
        />
      )}

      {suggestions.length > 0 && !detailedItemFromResponse && !reservationDisplayFromContext && waiterResponse.interactiveFlow?.type !== 'reservation' && (
        <div className="mt-3 pt-3 border-t border-brand-border flex flex-wrap gap-2">
          {suggestions}
        </div>
      )}
    </div>
  );
};