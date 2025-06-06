import React from 'react';
import { FullMenuItem } from '../types'; 
import { AllergenTag } from './AllergenTag';
import { SuggestionButton } from './SuggestionButton';
import { ShoppingCart, Flame, Star, Zap } from 'lucide-react'; 

interface DetailedMenuItemCardProps {
  item: FullMenuItem; 
  onSuggestionClick: (suggestion: string) => void; 
}

export const DetailedMenuItemCard: React.FC<DetailedMenuItemCardProps> = ({ item, onSuggestionClick }) => {
  const placeholderBase = "https://via.placeholder.com/600x400";
  const placeholderColors = "/2A2A2A/E0E0E0"; 
  const placeholderImage = `${placeholderBase}${placeholderColors}?text=${encodeURIComponent(item.name)}`;
  
  const imageUrl = item.imageUrl || placeholderImage;

  const isSpicy = item.displayTags?.some(tag => tag.toLowerCase() === 'spicy') || item.allergens?.some(allergen => allergen.toLowerCase() === 'chili');
  const isPopular = item.displayTags?.some(tag => tag.toLowerCase() === 'popular');
  const isNew = item.displayTags?.some(tag => tag.toLowerCase() === 'new');

  const otherDisplayTags = item.displayTags?.filter(
    tag => !['spicy', 'popular', 'new'].includes(tag.toLowerCase()) && 
           !(item.allergens || []).includes(tag.toLowerCase()) && 
           !(item.dietary_tags || []).includes(tag.toLowerCase())
  ) || [];

  const allTagsForDisplay = [
    ...(item.allergens?.map(a => ({ name: a, type: 'allergen' })) || []),
    ...(item.dietary_tags?.map(d => ({ name: d, type: 'dietary' })) || []),
    ...(otherDisplayTags.map(tag => ({ name: tag, type: 'info' })) || [])
  ].filter((tag, index, self) => 
    index === self.findIndex((t) => t.name.toLowerCase() === tag.name.toLowerCase())
  );


  const handleAddToCartClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSuggestionClick(`Add ${item.id} to order`); 
  };

  return (
    <div className="bg-brand-surface-dark rounded-xl shadow-card overflow-hidden my-2 border border-brand-border max-w-2xl mx-auto">
      <div className="relative">
        <img 
          src={imageUrl} 
          alt={item.name} 
          className="w-full h-56 sm:h-64 object-cover"
          onError={(e) => (e.currentTarget.src = placeholderImage)}
        />
        <div className="absolute top-3 right-3 flex flex-col space-y-2 items-end">
            {item.price != null && (
              <div className="bg-brand-secondary text-brand-bg-dark text-sm font-semibold px-3 py-1 rounded-full shadow-md">
                RM {item.price.toFixed(2)}
              </div>
            )}
            {isSpicy && (
                <span className="p-1.5 bg-rose-500/80 text-white rounded-full shadow-md"><Flame size={16}/></span>
            )}
            {isPopular && (
                <span className="p-1.5 bg-yellow-400/80 text-brand-bg-dark rounded-full shadow-md"><Star size={16}/></span>
            )}
            {isNew && (
                <span className="p-1.5 bg-sky-500/80 text-white rounded-full shadow-md"><Zap size={16}/></span>
            )}
        </div>
      </div>
      <div className="p-4 sm:p-6">
        <h3 className="text-xl sm:text-2xl font-bold text-brand-text-primary mb-2">{item.name}</h3>
        <p className="text-sm text-brand-text-secondary mb-4">{item.description}</p>
        
        {allTagsForDisplay.length > 0 && (
          <div className="mb-4">
            <h4 className="text-xs font-semibold text-brand-text-secondary uppercase tracking-wider mb-1.5">Tags & Dietary Info</h4>
            <div className="flex flex-wrap gap-2">
                {allTagsForDisplay.map(tagInfo => (
                <AllergenTag key={tagInfo.name} tag={tagInfo.name} />
                ))}
            </div>
          </div>
        )}
        
        {item.ingredients && item.ingredients.length > 0 && (
            <div className="mb-4">
                <h4 className="text-xs font-semibold text-brand-text-secondary uppercase tracking-wider mb-1.5">Key Ingredients</h4>
                <p className="text-sm text-brand-text-secondary">{item.ingredients.join(', ')}.</p>
            </div>
        )}

        {item.available_options && item.available_options.length > 0 && (
          <div className="mb-4 p-3 bg-brand-surface-light rounded-lg">
            <h4 className="text-sm font-semibold text-brand-text-primary mb-2">Available Options</h4>
            {item.available_options.map(opt => (
              <div key={opt.id} className="text-sm text-brand-text-secondary mb-1">
                <strong className="text-brand-text-primary">{opt.name}:</strong> {opt.values.join(' / ')} (Default: {opt.default})
              </div>
            ))}
          </div>
        )}

        {item.available_modifiers && item.available_modifiers.length > 0 && (
          <div className="mb-6 p-3 bg-brand-surface-light rounded-lg">
            <h4 className="text-sm font-semibold text-brand-text-primary mb-2">Customizations / Add-ons</h4>
            {item.available_modifiers.map(mod => (
              <div key={mod.id} className="text-sm text-brand-text-secondary mb-1">
                {mod.name} {mod.price_change !== 0 ? <span className="text-brand-secondary">({mod.price_change > 0 ? '+' : ''}RM {mod.price_change.toFixed(2)})</span> : ''}
              </div>
            ))}
          </div>
        )}

        <button
            onClick={handleAddToCartClick}
            className="w-full flex items-center justify-center px-4 py-3 bg-brand-primary text-white rounded-lg font-semibold shadow-md hover:bg-brand-primary-variant focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-opacity-75 transition-all active:scale-95 text-base"
            aria-label={`Add ${item.name} to order`}
        >
            <ShoppingCart size={20} className="mr-2.5" />
            Add to Order
        </button>

        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-brand-border">
          <SuggestionButton text={`More about "${item.name.split(' ')[0]}" items`} onClick={() => onSuggestionClick(`Tell me more about ${item.id}`)} variant="secondary" />
          <SuggestionButton text="How is it prepared?" onClick={() => onSuggestionClick(`How is ${item.id} prepared?`)} variant="secondary"/>
        </div>
      </div>
    </div>
  );
};