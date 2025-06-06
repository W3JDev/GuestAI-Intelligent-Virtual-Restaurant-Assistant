import React from 'react';
import { FullMenuItem } from '../../types';
import { WaiterAIResponse } from '../../services/chatService';
import { MenuItemCard } from '../MenuItemCard';
import { SuggestionButton } from '../SuggestionButton';

const extractListedItems = (responseText: string, allItems: FullMenuItem[]): FullMenuItem[] => {
  const listedItems: FullMenuItem[] = [];
  if (!responseText || !allItems || allItems.length === 0) return listedItems;

  const lines = responseText.split('\n');
  lines.forEach(line => {
    const itemMatch = line.match(/^(?:\*|-|\d+\.)\s*(.*?)(?:\s*\(ID:\s*([\w-]+).*?\))?(?:\s*-\s*RM\s*\d+\.\d+)?$/i);
    const potentialItemText = itemMatch ? itemMatch[1]?.trim() : line.trim();
    const potentialItemIdFromRegex = itemMatch ? itemMatch[2]?.trim() : null;


    if (potentialItemText) {
        let foundItem = allItems.find(item => 
            item.name.toLowerCase() === potentialItemText.toLowerCase() || 
            item.id.toLowerCase() === potentialItemText.toLowerCase() ||
            (potentialItemIdFromRegex && item.id.toLowerCase() === potentialItemIdFromRegex.toLowerCase())
        );

        if (!foundItem) {
            foundItem = allItems.find(item => 
                potentialItemText.toLowerCase().includes(item.id.toLowerCase()) || 
                potentialItemText.toLowerCase().includes(item.name.toLowerCase().substring(0, Math.max(5, item.name.length -3 ))) 
            );
        }
        
        if (foundItem && !listedItems.some(li => li.id === foundItem!.id)) { 
            listedItems.push(foundItem);
        }
    }
  });
  
  if (listedItems.length === 0 && !responseText.includes('\n')) { 
      allItems.forEach(item => {
          if (responseText.toLowerCase().includes(item.name.toLowerCase()) && !listedItems.some(li => li.id === item.id)) {
              listedItems.push(item);
          }
      });
  }
  return listedItems;
};

const getGeneralSuggestions = (responseText: string | undefined, onSuggestionClick: (suggestion: string) => void): JSX.Element[] => {
  const suggestions: JSX.Element[] = [];
  if (!responseText) return suggestions;
  const lowerResponse = responseText.toLowerCase();

  if (lowerResponse.includes("anything else?") || lowerResponse.includes("what else can i get for you?")) {
     suggestions.push(<SuggestionButton key="sg-viewmenu" text="Menu Categories" onClick={() => onSuggestionClick("Show menu categories")} />);
     suggestions.push(<SuggestionButton key="sg-checkout" text="View My Order" onClick={() => onSuggestionClick("View my current order details")} />);
  }
  return suggestions.slice(0, 2);
};

interface BotCategoryItemsDisplayProps {
  waiterResponse: WaiterAIResponse;
  allMenuItems: FullMenuItem[];
  onSuggestionClick: (suggestion: string) => void;
}

export const BotCategoryItemsDisplay: React.FC<BotCategoryItemsDisplayProps> = ({
  waiterResponse,
  allMenuItems,
  onSuggestionClick,
}) => {
  const categoryItems = extractListedItems(waiterResponse.response, allMenuItems);
  const suggestions = getGeneralSuggestions(waiterResponse.response, onSuggestionClick);

  if (categoryItems.length === 0) {
     return null; 
  }

  return (
    <div className="space-y-3 w-full"> 
      {categoryItems.length > 0 && (
        <div className="flex overflow-x-auto space-x-3 sm:space-x-4 py-2 -mx-1 sm:-mx-2 px-1 sm:px-2 w-full snap-x snap-mandatory">
          {categoryItems.map(item => {
            const isSpicy = item.displayTags?.some(tag => tag.toLowerCase() === 'spicy') || 
                            item.allergens?.some(allergen => allergen.toLowerCase() === 'chili');
            return (
              <div key={item.id} className="snap-start flex-shrink-0"> 
                <MenuItemCard
                  item={item}
                  onSuggestionClick={onSuggestionClick}
                  isOrderContext={false}
                  isSpicy={isSpicy}
                />
              </div>
            );
          })}
        </div>
      )}
      {suggestions.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2 px-1 sm:px-2"> 
          {suggestions}
        </div>
      )}
    </div>
  );
};