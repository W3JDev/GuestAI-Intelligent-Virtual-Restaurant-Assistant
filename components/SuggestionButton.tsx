
import React from 'react';

interface SuggestionButtonProps {
  text: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

export const SuggestionButton: React.FC<SuggestionButtonProps> = ({ text, onClick, variant = 'secondary' }) => { // Default to secondary for less prominent suggestions
  const baseStyle = "px-3 py-1.5 text-xs sm:text-sm rounded-full font-medium focus:outline-none focus:ring-2 focus:ring-opacity-75 transition-all shadow-sm hover:shadow-md active:scale-95";
  
  const styles = {
    primary: `bg-brand-primary text-white hover:bg-brand-primary-variant focus:ring-brand-primary`,
    secondary: `bg-brand-surface-light text-brand-text-primary hover:bg-opacity-80 focus:ring-brand-secondary`
  };

  return (
    <button
      onClick={onClick}
      className={`${baseStyle} ${styles[variant]}`}
      aria-label={`Suggestion: ${text}`}
    >
      {text}
    </button>
  );
};