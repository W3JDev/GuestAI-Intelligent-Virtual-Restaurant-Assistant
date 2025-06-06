import React from 'react';
import { InteractiveFlowData } from '../../../types'; // Adjust path as necessary
import { InteractiveOptionButton } from './InteractiveOptionButton';

interface BotReservationFlowHandlerProps {
  interactiveFlowData: InteractiveFlowData;
  onSuggestionClick: (suggestion: string) => void;
}

export const BotReservationFlowHandler: React.FC<BotReservationFlowHandlerProps> = ({
  interactiveFlowData,
  onSuggestionClick,
}) => {
  const { promptText, options, step, type } = interactiveFlowData;

  const handleOptionClick = (value: string, isTextInputTrigger?: boolean) => {
    if (isTextInputTrigger) {
      // For now, if it's a text input trigger, we assume the AI's promptText
      // guides the user to type in the main chat input.
      // The 'value' here might be something like 'other' or 'pick_date'.
      // We send this value so AI knows which option led to text input.
      // Example: "Reservation step: askGuestCount, value: other"
      // AI's next promptText should then say "Please type the number of guests."
      onSuggestionClick(`${type} step: ${step}, value: ${value}, expectsInput: true`);
    } else {
      onSuggestionClick(`${type} step: ${step}, value: ${value}`);
    }
  };

  return (
    <div className="mt-2 p-1 bg-brand-bot-message-bg rounded-b-xl w-full"> {/* Ensure it uses available width */}
      {promptText && (
        <p className="text-sm text-brand-text-secondary mb-2 px-1">{promptText}</p>
      )}
      <div className="space-y-1">
        {options?.map((option) => (
          <InteractiveOptionButton
            key={option.value}
            label={option.label}
            emoji={option.emoji}
            onClick={() => handleOptionClick(option.value, option.isTextInputTrigger)}
          />
        ))}
      </div>
    </div>
  );
};