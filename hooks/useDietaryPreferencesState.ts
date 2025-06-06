import { useState, useEffect, useCallback } from 'react';

export const COMMON_PREFERENCES = [
  { id: 'vegetarian', label: 'Vegetarian' },
  { id: 'vegan', label: 'Vegan' },
  { id: 'gluten-free', label: 'Gluten-Free' },
  { id: 'dairy-free', label: 'Dairy-Free' },
];

export const COMMON_ALLERGENS_SUGGESTIONS = [
    'nuts', 'peanuts', 'shellfish', 'soy', 'egg', 'fish', 'sesame', 'chili'
];

export const useDietaryPreferencesState = (isOpen: boolean, currentPreferences: string[]) => {
  const [selectedCommonPrefs, setSelectedCommonPrefs] = useState<Record<string, boolean>>({});
  const [otherRestrictionsText, setOtherRestrictionsText] = useState('');

  useEffect(() => {
    if (isOpen) {
      const initialCommon: Record<string, boolean> = {};
      const otherTexts: string[] = [];

      currentPreferences.forEach(pref => {
        const commonMatch = COMMON_PREFERENCES.find(cp => cp.id === pref.toLowerCase() || cp.label.toLowerCase() === pref.toLowerCase());
        if (commonMatch) {
          initialCommon[commonMatch.id] = true;
        } else {
          otherTexts.push(pref);
        }
      });
      setSelectedCommonPrefs(initialCommon);
      setOtherRestrictionsText(otherTexts.join(', '));
    }
  }, [isOpen, currentPreferences]);

  const handleSave = useCallback((): string[] => {
    const combinedPreferences: string[] = [];
    COMMON_PREFERENCES.forEach(cp => {
      if (selectedCommonPrefs[cp.id]) {
        combinedPreferences.push(cp.label);
      }
    });
    
    const otherPrefs = otherRestrictionsText
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0)
      .map(s => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()); // Capitalize consistently
      
    // Add otherPrefs only if they aren't already covered by common preference labels
    otherPrefs.forEach(op => {
        if (!combinedPreferences.some(cp => cp.toLowerCase() === op.toLowerCase())) {
            combinedPreferences.push(op);
        }
    });
    
    return [...new Set(combinedPreferences)]; // Ensure unique
  }, [selectedCommonPrefs, otherRestrictionsText]);

  const handleReset = useCallback(() => {
    setSelectedCommonPrefs({});
    setOtherRestrictionsText('');
  }, []);

  return {
    selectedCommonPrefs,
    otherRestrictionsText,
    setSelectedCommonPrefs,
    setOtherRestrictionsText,
    handleSave,
    handleReset,
  };
};