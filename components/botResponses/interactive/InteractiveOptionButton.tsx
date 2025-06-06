import React from 'react';

interface InteractiveOptionButtonProps {
  label: string;
  emoji?: string;
  onClick: () => void;
  className?: string;
}

export const InteractiveOptionButton: React.FC<InteractiveOptionButtonProps> = ({
  label,
  emoji,
  onClick,
  className = '',
}) => {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-start text-left px-3.5 py-2.5 my-1.5
                  bg-brand-surface-light hover:bg-brand-primary/15 rounded-lg 
                  transition-all duration-150 ease-out shadow-sm
                  focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-opacity-75
                  active:scale-[0.98] active:bg-brand-primary/20 group ${className}`}
      aria-label={label}
    >
      {emoji && <span className="mr-2.5 text-lg">{emoji}</span>}
      <span className="text-sm font-medium text-brand-text-primary group-hover:text-brand-primary transition-colors">
        {label}
      </span>
    </button>
  );
};