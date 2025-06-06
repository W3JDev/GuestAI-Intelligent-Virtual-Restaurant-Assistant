
import React from 'react';

interface WelcomeSuggestionCardProps {
  icon: React.ElementType; // Lucide icon component or similar
  text: string;
  subtitle: string;
  onClick: () => void;
}

export const WelcomeSuggestionCard: React.FC<WelcomeSuggestionCardProps> = ({
  icon: Icon,
  text,
  subtitle,
  onClick,
}) => {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center text-center p-4 sm:p-5 bg-brand-surface-dark rounded-xl shadow-subtle border border-brand-border 
                 hover:bg-brand-surface-light hover:border-brand-primary/40 transition-all duration-200 ease-out 
                 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-opacity-75 
                 active:scale-[0.97] active:bg-brand-surface-light/80 group h-full"
      aria-label={`${text}. ${subtitle}`}
    >
      <Icon size={28} className="mb-2.5 text-brand-secondary group-hover:text-brand-primary transition-colors duration-200" />
      <p className="text-sm sm:text-base font-semibold text-brand-text-primary mb-1 group-hover:text-brand-primary transition-colors duration-200">{text}</p>
      <p className="text-xs text-brand-text-secondary/80">{subtitle}</p>
    </button>
  );
};
