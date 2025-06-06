
import React, { useState, useEffect } from 'react';
import { X, Save, RotateCcw } from 'lucide-react';
import { useDietaryPreferencesState, COMMON_PREFERENCES, COMMON_ALLERGENS_SUGGESTIONS } from '../hooks/useDietaryPreferencesState';

interface DietaryPreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPreferences: string[];
  onSavePreferences: (preferences: string[]) => void;
}

export const DietaryPreferencesModal: React.FC<DietaryPreferencesModalProps> = ({
  isOpen,
  onClose,
  currentPreferences,
  onSavePreferences,
}) => {
  const {
    selectedCommonPrefs,
    otherRestrictionsText,
    setSelectedCommonPrefs,
    setOtherRestrictionsText,
    handleSave: buildAndSavePreferences,
    handleReset,
  } = useDietaryPreferencesState(isOpen, currentPreferences);

  const [isRendered, setIsRendered] = useState(false);
  const [animationClass, setAnimationClass] = useState('');

  useEffect(() => {
    let timerId: number;
    if (isOpen) {
        setIsRendered(true);
        timerId = window.setTimeout(() => {
            setAnimationClass('modal-animate-in');
        }, 10); 
    } else if (isRendered && !isOpen) {
        setAnimationClass('modal-animate-out');
        timerId = window.setTimeout(() => {
            setIsRendered(false);
            setAnimationClass(''); 
        }, 300); 
    }
    return () => window.clearTimeout(timerId);
  }, [isOpen, isRendered]);

  const handleModalSave = () => {
    const finalPreferences = buildAndSavePreferences();
    onSavePreferences(finalPreferences);
  };

  if (!isRendered && animationClass === '') return null;

  return (
    <div
      className={`modal-container fixed inset-0 z-50 p-4 flex items-center justify-center ${animationClass}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="dietary-modal-title"
    >
      <div className="modal-backdrop-overlay fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose}></div>
      <div
        className="modal-content-panel relative bg-brand-surface-dark w-full max-w-md rounded-xl shadow-xl border border-brand-border flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-brand-border">
          <h2 id="dietary-modal-title" className="text-lg font-semibold text-brand-text-primary">
            Dietary Preferences & Allergens
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-brand-surface-light text-brand-text-secondary focus:outline-none focus:ring-2 focus:ring-brand-primary active:scale-90 transition-transform"
            aria-label="Close dietary preferences modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body - Scrollable Content */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto">
          <div>
            <h3 className="text-sm font-medium text-brand-text-primary mb-2">Common Preferences:</h3>
            <div className="grid grid-cols-2 gap-2">
              {COMMON_PREFERENCES.map(pref => (
                <label key={pref.id} className="flex items-center space-x-2 p-2 bg-brand-surface-light rounded-md hover:bg-opacity-80 cursor-pointer active:scale-95 transition-transform">
                  <input
                    type="checkbox"
                    checked={!!selectedCommonPrefs[pref.id]}
                    onChange={() => setSelectedCommonPrefs(prev => ({ ...prev, [pref.id]: !prev[pref.id] }))}
                    className="h-4 w-4 rounded border-brand-border text-brand-primary focus:ring-brand-primary bg-brand-surface-dark"
                  />
                  <span className="text-xs text-brand-text-secondary">{pref.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="otherRestrictions" className="block text-sm font-medium text-brand-text-primary mb-1">
              Other Allergens or Restrictions:
            </label>
            <input
              type="text"
              id="otherRestrictions"
              value={otherRestrictionsText}
              onChange={(e) => setOtherRestrictionsText(e.target.value)}
              placeholder="e.g., nuts, shellfish, no mushrooms"
              className="w-full p-2.5 bg-brand-surface-light border border-brand-border rounded-md text-sm text-brand-text-primary focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none placeholder-brand-text-input-placeholder"
            />
             <div className="mt-1.5 text-xs text-brand-text-secondary">
                Common allergens: {COMMON_ALLERGENS_SUGGESTIONS.map((s) => (
                    <button 
                        key={s} 
                        onClick={() => setOtherRestrictionsText(prev => {
                            const prevLower = prev.toLowerCase();
                            const sLower = s.toLowerCase();
                            if (prevLower.split(',').map(p=>p.trim()).includes(sLower)) return prev; // Avoid duplicates
                            return prev ? `${prev}, ${s}` : s;
                        })} 
                        className="hover:text-brand-primary underline mr-1.5 active:scale-95 transition-transform"
                    >
                        {s}
                    </button>
                ))}
             </div>
          </div>
        </div>

        {/* Footer - Actions */}
        <div className="p-4 border-t border-brand-border mt-auto bg-brand-surface-dark rounded-b-xl flex justify-between items-center space-x-2">
           <button
            onClick={handleReset}
            className="flex items-center justify-center px-4 py-2 bg-brand-surface-light text-brand-text-secondary rounded-lg font-medium shadow-sm hover:bg-opacity-80 focus:outline-none focus:ring-2 focus:ring-brand-secondary transition-all active:scale-95"
            aria-label="Reset preferences"
          >
            <RotateCcw size={16} className="mr-1.5" />
            Reset
          </button>
          <button
            onClick={handleModalSave}
            className="flex items-center justify-center px-6 py-2.5 bg-brand-primary text-white rounded-lg font-semibold shadow-md hover:bg-brand-primary-variant focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-opacity-75 transition-all active:scale-95"
            aria-label="Save dietary preferences"
          >
            <Save size={18} className="mr-2" />
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
};