
import React, { useMemo, useState, useEffect } from 'react';
import { FullMenuItem, OrderItemOption, OrderItemModifier } from '../types';
import { X, CheckCircle } from 'lucide-react';
import { useCustomizationModalState } from '../hooks/useCustomizationModalState';

interface CustomizationModalProps {
  item: FullMenuItem | null; // Allow null for when modal is closing but item might be reset
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (
    item: FullMenuItem,
    quantity: number,
    selectedOptions: OrderItemOption[],
    appliedModifiers: OrderItemModifier[]
  ) => void;
}

export const CustomizationModal: React.FC<CustomizationModalProps> = ({
  item,
  isOpen,
  onClose,
  onConfirm,
}) => {
  const {
    quantity,
    currentSelectedOptions,
    currentAppliedModifiers,
    setQuantity,
    handleOptionChange,
    handleModifierToggle,
  } = useCustomizationModalState(item);

  const [isRendered, setIsRendered] = useState(false);
  const [animationClass, setAnimationClass] = useState('');

  useEffect(() => {
    let timerId: number;
    if (isOpen && item) { // Ensure item is present to open
        setIsRendered(true);
        // Delay to allow DOM element to be present before adding animation class for entry
        timerId = window.setTimeout(() => {
            setAnimationClass('modal-animate-in');
        }, 10); 
    } else if (isRendered && !isOpen) { // Was rendered, now isOpen is false (triggered by onClose prop)
        setAnimationClass('modal-animate-out');
        timerId = window.setTimeout(() => {
            setIsRendered(false);
            setAnimationClass(''); 
        }, 300); // Match CSS animation duration for exit
    }
    return () => window.clearTimeout(timerId);
  }, [isOpen, isRendered, item]);


  const calculateTotalPrice = useMemo(() => {
    if (!item) return 0;
    let currentPrice = item.price;
    item.available_modifiers?.forEach(mod => {
      if (currentAppliedModifiers[mod.id]) {
        currentPrice += mod.price_change;
      }
    });
    return currentPrice * quantity;
  }, [item, currentAppliedModifiers, quantity]);

  const handleConfirmClick = () => {
    if (!item) return;

    const finalSelectedOptions: OrderItemOption[] = [];
    item.available_options?.forEach(opt => {
      if (currentSelectedOptions[opt.id]) {
        finalSelectedOptions.push({
          option_id: opt.id,
          option_name: opt.name,
          value: currentSelectedOptions[opt.id],
        });
      }
    });

    const finalAppliedModifiers: OrderItemModifier[] = [];
    item.available_modifiers?.forEach(mod => {
      if (currentAppliedModifiers[mod.id]) {
        finalAppliedModifiers.push({
          modifier_id: mod.id,
          mod_name: mod.name,
          price_change: mod.price_change,
        });
      }
    });
    onConfirm(item, quantity, finalSelectedOptions, finalAppliedModifiers);
  };
  
  if (!isRendered && animationClass === '') return null;
  if (!item && isRendered) return null; // If item becomes null while modal is trying to be visible, hide it.

  const placeholderBase = "https://via.placeholder.com/150x100";
  const placeholderColors = "/4A4A4A/E0E0E0"; 
  const placeholderImage = item ? `${placeholderBase}${placeholderColors}?text=${encodeURIComponent(item.name)}` : '';
  const imageUrl = item?.imageUrl || placeholderImage;

  return (
    <div 
        className={`modal-container fixed inset-0 z-50 p-4 flex items-center justify-center ${animationClass}`}
        aria-modal="true"
        aria-labelledby="customization-modal-title"
        role="dialog"
    >
      <div className="modal-backdrop-overlay fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose}></div>
      <div 
        className="modal-content-panel relative bg-brand-surface-dark w-full max-w-lg rounded-xl shadow-xl border border-brand-border flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-brand-border">
          <h2 id="customization-modal-title" className="text-lg font-semibold text-brand-text-primary truncate flex-1 mr-2">Customize: {item?.name}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-brand-surface-light text-brand-text-secondary focus:outline-none focus:ring-2 focus:ring-brand-primary active:scale-90 transition-transform"
            aria-label="Close customization modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body - Scrollable Content */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto">
          {item && (
            <>
              <div className="flex items-center space-x-4 mb-2">
                <img src={imageUrl} alt={item.name} className="w-24 h-24 rounded-lg object-cover border border-brand-border" onError={(e) => {(e.target as HTMLImageElement).src = placeholderImage;}} />
                <div>
                    <p className="text-sm text-brand-text-secondary">{item.description.split('.')[0] + '.'}</p>
                    <p className="text-md font-semibold text-brand-primary mt-1">Base Price: RM {item.price.toFixed(2)}</p>
                </div>
              </div>
              
              {/* Quantity Selector */}
              <div className="flex items-center justify-between">
                <label htmlFor="quantity" className="text-sm font-medium text-brand-text-primary">Quantity</label>
                <div className="flex items-center border border-brand-border rounded-md">
                  <button 
                    onClick={() => setQuantity(q => Math.max(1, q - 1))} 
                    className="px-3 py-1.5 text-brand-primary hover:bg-brand-surface-light rounded-l-md focus:outline-none active:scale-90 transition-transform"
                    aria-label="Decrease quantity"
                  >-</button>
                  <input 
                    type="number" 
                    id="quantity"
                    value={quantity} 
                    readOnly 
                    className="w-12 text-center bg-transparent text-brand-text-primary focus:outline-none"
                    aria-label="Current quantity" 
                  />
                  <button 
                    onClick={() => setQuantity(q => q + 1)} 
                    className="px-3 py-1.5 text-brand-primary hover:bg-brand-surface-light rounded-r-md focus:outline-none active:scale-90 transition-transform"
                    aria-label="Increase quantity"
                  >+</button>
                </div>
              </div>

              {/* Options */}
              {item.available_options && item.available_options.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-brand-text-primary mb-1.5">Options</h3>
                  {item.available_options.map(opt => (
                    <div key={opt.id} className="mb-2.5">
                      <label htmlFor={opt.id} className="block text-xs font-medium text-brand-text-secondary mb-1">{opt.name}</label>
                      <select
                        id={opt.id}
                        value={currentSelectedOptions[opt.id] || opt.default}
                        onChange={(e) => handleOptionChange(opt.id, e.target.value)}
                        className="w-full p-2.5 bg-brand-surface-light border border-brand-border rounded-md text-sm text-brand-text-primary focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none"
                      >
                        {opt.values.map(val => (
                          <option key={val} value={val}>{val}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              )}

              {/* Modifiers */}
              {item.available_modifiers && item.available_modifiers.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-brand-text-primary mb-1.5">Add-ons / Customizations</h3>
                  {item.available_modifiers.map(mod => (
                    <div key={mod.id} className="flex items-center justify-between mb-1.5 p-2 bg-brand-surface-light rounded-md">
                      <label htmlFor={mod.id} className="flex items-center cursor-pointer text-sm text-brand-text-secondary">
                        <input
                          type="checkbox"
                          id={mod.id}
                          checked={!!currentAppliedModifiers[mod.id]}
                          onChange={() => handleModifierToggle(mod.id)}
                          className="mr-2 h-4 w-4 rounded border-brand-border text-brand-primary focus:ring-brand-primary bg-brand-surface-dark"
                        />
                        {mod.name}
                      </label>
                      <span className="text-xs text-brand-text-primary">
                        {mod.price_change !== 0 ? `(${mod.price_change > 0 ? '+' : ''}RM${mod.price_change.toFixed(2)})` : '(No extra cost)'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
        
        {/* Footer - Actions */}
        <div className="p-4 border-t border-brand-border mt-auto bg-brand-surface-dark rounded-b-xl">
          <div className="flex justify-between items-center mb-3">
            <p className="text-sm font-medium text-brand-text-primary">Total Price:</p>
            <p className="text-lg font-bold text-brand-secondary">RM {calculateTotalPrice.toFixed(2)}</p>
          </div>
          <button
            onClick={handleConfirmClick}
            disabled={!item}
            className="w-full flex items-center justify-center px-4 py-2.5 bg-brand-primary text-white rounded-lg font-semibold shadow-md hover:bg-brand-primary-variant focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-opacity-75 transition-all active:scale-95 disabled:opacity-50"
            aria-label="Confirm and add to order"
          >
            <CheckCircle size={18} className="mr-2" />
            Confirm & Add to Order
          </button>
        </div>
      </div>
    </div>
  );
};