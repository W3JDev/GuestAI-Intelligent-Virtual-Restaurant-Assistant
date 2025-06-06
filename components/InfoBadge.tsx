
import React from 'react';
import { Star, Zap, Flame } from 'lucide-react'; // Example icons

interface InfoBadgeProps {
  text: string;
  type: 'popular' | 'new' | 'spicy';
  className?: string;
}

export const InfoBadge: React.FC<InfoBadgeProps> = ({ text, type, className = '' }) => {
  let badgeStyle = '';
  let IconComponent = null;

  switch (type) {
    case 'popular':
      badgeStyle = 'bg-yellow-400/20 text-yellow-300 border-yellow-500/40';
      IconComponent = Star;
      break;
    case 'new':
      badgeStyle = 'bg-sky-500/20 text-sky-300 border-sky-500/40';
      IconComponent = Zap;
      break;
    case 'spicy':
      badgeStyle = 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      IconComponent = Flame;
      break;
    default:
      badgeStyle = 'bg-gray-500/20 text-gray-300 border-gray-500/40';
  }

  return (
    <span 
      className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full border ${badgeStyle} ${className}`}
    >
      {IconComponent && <IconComponent size={12} className="mr-1" />}
      {text}
    </span>
  );
};
