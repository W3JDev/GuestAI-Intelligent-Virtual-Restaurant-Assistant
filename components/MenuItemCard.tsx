
import React from 'react';
import { FullMenuItem } from '../types'; 
import { Plus, Flame } from 'lucide-react'; 
import { InfoBadge } from './InfoBadge';

interface MenuItemCardProps {
  item: FullMenuItem; 
  onSuggestionClick: (suggestion: string) => void;
  isOrderContext?: boolean; 
  quantity?: number; 
  totalItemPrice?: number; 
  isSpicy?: boolean;
}

export const MenuItemCard: React.FC<MenuItemCardProps> = ({ 
  item, 
  onSuggestionClick, 
  isOrderContext,
  quantity,
  totalItemPrice,
  isSpicy
}) => {
  const hasImage = item.imageUrl && item.imageUrl.trim() !== '';
  
  const handleCardClick = () => {
    if (!isOrderContext) {
        // Use item ID for "Tell me more" to be unambiguous for the AI/system
        onSuggestionClick(`Tell me more about ${item.id}`);
    }
  };

  const itemNameDisplay = isOrderContext && quantity 
    ? `${item.name.replace(/\s\(x\d+\)$/, '')} (x${quantity})` 
    : item.name;

  const priceDisplay = isOrderContext && totalItemPrice != null
    ? totalItemPrice 
    : item.price;

  const getBadges = () => {
    const badges: JSX.Element[] = [];
    if (item.displayTags?.some(tag => tag.toLowerCase() === 'popular')) {
      badges.push(<InfoBadge key="popular" type="popular" text="Popular" />);
    }
    if (item.displayTags?.some(tag => tag.toLowerCase() === 'new')) {
      badges.push(<InfoBadge key="new" type="new" text="New" />);
    }
    return badges;
  };

  const itemBadges = getBadges();

  if (isOrderContext) {
    return (
      <div className="p-3 bg-brand-surface-dark rounded-lg shadow-sm flex space-x-3 items-start">
        {hasImage ? (
          <img 
            src={item.imageUrl} 
            alt={item.name} 
            className="w-16 h-16 rounded-md object-cover flex-shrink-0 border border-brand-border/30"
          />
        ) : (
          <div className="w-16 h-16 rounded-md bg-brand-surface-light flex items-center justify-center flex-shrink-0 p-1 border border-brand-border/30">
            <span className="text-xs text-brand-text-secondary text-center break-words">{item.name.substring(0,20)}</span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-brand-text-primary line-clamp-2">{itemNameDisplay}</h3>
          {priceDisplay != null && (
            <div className="text-xs font-semibold text-brand-secondary mt-0.5 flex items-center">
                RM {priceDisplay.toFixed(2)}
                {isSpicy && !item.displayTags?.some(tag => tag.toLowerCase() === 'spicy') && <Flame size={12} className="inline ml-1 text-rose-400" />} 
            </div>
          )}
          <p className="text-xs text-brand-text-secondary mt-1 line-clamp-1">{item.shortDescription || item.description}</p>
          {itemBadges.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {itemBadges.map(badge => React.cloneElement(badge, { className: `${badge.props.className || ''} px-1.5 py-0 text-[0.6rem]`}))}
            </div>
          )}
           {isSpicy && item.displayTags?.some(tag => tag.toLowerCase() === 'spicy') && (
             <InfoBadge key="spicy-order" type="spicy" text="Spicy" className="mt-1 px-1.5 py-0 text-[0.6rem]" />
           )}
        </div>
      </div>
    );
  }

  const cardBaseClasses = "flex flex-col flex-shrink-0 w-60 sm:w-64 h-72 rounded-xl shadow-subtle overflow-hidden transition-all duration-200 ease-out bg-brand-bot-message-bg"; 
  const interactiveClasses = 'cursor-pointer active:scale-[0.98] hover:shadow-card'; 
  const placeholderImage = `https://via.placeholder.com/300x240/1E1E1E/E0E0E0?text=${encodeURIComponent(item.name)}`;

  return (
    <div 
      className={`${cardBaseClasses} ${interactiveClasses}`}
      onClick={handleCardClick}
      onKeyPress={(e) => e.key === 'Enter' && handleCardClick()}
      role="button"
      tabIndex={0}
      aria-label={`View details for ${item.name}`}
    >
      <div className="relative w-full h-44"> {/* Approx 60% of h-72 */}
        <img 
          src={hasImage ? item.imageUrl : placeholderImage} 
          alt={item.name} 
          className="w-full h-full object-cover" 
          onError={(e) => {(e.target as HTMLImageElement).src = placeholderImage;}}
        />
        <button 
            onClick={(e) => { e.stopPropagation(); onSuggestionClick(`Add ${item.id} to order`); }}
            // Increased padding for better touch target on mobile
            className="absolute top-2 right-2 p-2.5 rounded-full bg-brand-primary text-white hover:bg-brand-primary-variant transition-colors shadow-md hover:shadow-lg active:scale-95"
            aria-label={`Add ${item.name} to order`}
        >
            <Plus size={20} /> {/* Slightly larger icon */}
        </button>
      </div>
      {/* Content area takes remaining height, approx 40% */}
      <div className="p-3 flex flex-col justify-between flex-grow h-28"> {/* h-28 to complement h-44 in h-72 card */}
        <div className="space-y-1">
            <h3 className="text-base font-semibold text-brand-text-primary line-clamp-2">{item.name}</h3>
            
            {item.price != null && (
                <div className="text-sm font-medium text-brand-secondary flex items-center">
                    RM {item.price.toFixed(2)}
                    {isSpicy && <Flame size={14} className="inline ml-1.5 text-rose-400" />}
                </div>
            )}
            
            {/* Short description with line-clamp-1 to save space */}
            <p className="text-xs text-brand-text-secondary line-clamp-1 pt-0.5">{item.shortDescription || 'Details available.'}</p>
        </div>
        
        {itemBadges.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {itemBadges.map(badge => React.cloneElement(badge, {className: `${badge.props.className || ''} px-1.5 py-0.5 text-[0.65rem]`}))}
          </div>
        )}
      </div>
    </div>
  );
};
