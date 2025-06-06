
import React from 'react';
import { ChevronRight } from 'lucide-react';
import { SuggestionButton } from '../SuggestionButton'; // Assuming SuggestionButton handles its own styling

interface MenuCategoryButtonProps {
  categoryName: string;
  onClick: () => void;
}

const MenuCategoryButton: React.FC<MenuCategoryButtonProps> = ({ categoryName, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="w-full flex justify-between items-center text-left px-4 py-3 bg-brand-surface-light hover:bg-brand-primary/10 rounded-lg transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-brand-primary my-1 shadow-sm"
      aria-label={`Explore ${categoryName}`}
    >
      <span className="text-sm font-medium text-brand-text-primary">{categoryName}</span>
      <ChevronRight size={18} className="text-brand-secondary" />
    </button>
  );
};

const formatText = (text: string | undefined): string => {
  if (!text) return '';
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
    .replace(/\*(.*?)\*/g, '<em>$1</em>');       // Italics
};


interface BotMenuOptionsDisplayProps {
  responseText: string;
  onSuggestionClick: (suggestion: string) => void;
}

export const BotMenuOptionsDisplay: React.FC<BotMenuOptionsDisplayProps> = ({ responseText, onSuggestionClick }) => {
  const lines = responseText.split('\n');
  const elements: JSX.Element[] = [];
  const suggestions: JSX.Element[] = []; // For other types of suggestions if any

  lines.forEach((line, index) => {
    const trimmedLine = line.trim();
    const buttonMatch = trimmedLine.match(/^\*(.+?)\*\*$/); // Matches *Category Name**
    if (buttonMatch && buttonMatch[1]) {
      const categoryName = buttonMatch[1].trim();
      elements.push(
        <MenuCategoryButton
          key={`${categoryName}-${index}`}
          categoryName={categoryName}
          onClick={() => onSuggestionClick(`List ${categoryName} items`)}
        />
      );
    } else if (trimmedLine) {
      // Display non-button lines as regular text
      elements.push(
        <div
          key={`text-${index}`}
          className="text-sm text-brand-text-primary my-1"
          dangerouslySetInnerHTML={{ __html: formatText(trimmedLine) }}
        />
      );
    }
  });
  
  // Example of how general suggestions might be added (if your AI provides them separately)
  // This part needs to be adapted based on how your WaiterAIResponse might include general suggestions
  // For now, this is a placeholder. If `getSuggestions` was a utility, it could be used here.
  // if (waiterResponse.genericSuggestions) { 
  //   waiterResponse.genericSuggestions.forEach(s => {
  //     suggestions.push(<SuggestionButton key={s.query} text={s.text} onClick={() => onSuggestionClick(s.query)} />);
  //   });
  // }


  return (
    <div className="space-y-1">
      {elements}
      {suggestions.length > 0 && (
        <div className="mt-3 pt-3 border-t border-brand-border flex flex-wrap gap-2">
          {suggestions}
        </div>
      )}
    </div>
  );
};
