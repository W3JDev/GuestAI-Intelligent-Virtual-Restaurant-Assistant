import { useState, useEffect, useCallback } from 'react';
import { FullMenuItem } from '../types';

export const useCustomizationModalState = (item: FullMenuItem | null) => {
  const [quantity, setQuantity] = useState(1);
  const [currentSelectedOptions, setCurrentSelectedOptions] = useState<Record<string, string>>({});
  const [currentAppliedModifiers, setCurrentAppliedModifiers] = useState<Record<string, boolean>>({});

  const resetCustomizationState = useCallback(() => {
    if (item) {
      const initialOptions: Record<string, string> = {};
      item.available_options?.forEach(opt => {
        initialOptions[opt.id] = opt.default;
      });
      setCurrentSelectedOptions(initialOptions);
      setCurrentAppliedModifiers({});
      setQuantity(1);
    } else {
      setCurrentSelectedOptions({});
      setCurrentAppliedModifiers({});
      setQuantity(1);
    }
  }, [item]);

  useEffect(() => {
    resetCustomizationState();
  }, [item, resetCustomizationState]);

  const handleOptionChange = (optionId: string, value: string) => {
    setCurrentSelectedOptions(prev => ({ ...prev, [optionId]: value }));
  };

  const handleModifierToggle = (modifierId: string) => {
    setCurrentAppliedModifiers(prev => ({ ...prev, [modifierId]: !prev[modifierId] }));
  };

  return {
    quantity,
    currentSelectedOptions,
    currentAppliedModifiers,
    setQuantity,
    handleOptionChange,
    handleModifierToggle,
    resetCustomizationState,
  };
};