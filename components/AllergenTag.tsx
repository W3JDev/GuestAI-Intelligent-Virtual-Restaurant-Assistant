import React from 'react';

interface AllergenTagProps {
  tag: string;
}

// Dark theme optimized tag colors
const tagColorMapDark: Record<string, string> = {
  shellfish: 'bg-red-700/30 text-red-300 border-red-500/50',
  peanuts: 'bg-orange-700/30 text-orange-300 border-orange-500/50',
  gluten: 'bg-yellow-700/30 text-yellow-300 border-yellow-500/50',
  dairy: 'bg-blue-700/30 text-blue-300 border-blue-500/50',
  sesame: 'bg-gray-600/30 text-gray-300 border-gray-500/50',
  chili: 'bg-rose-700/30 text-rose-300 border-rose-500/50',
  garlic: 'bg-purple-700/30 text-purple-300 border-purple-500/50',
  onion: 'bg-purple-700/30 text-purple-300 border-purple-500/50',
  soy: 'bg-green-700/30 text-green-300 border-green-500/50',
  egg: 'bg-amber-700/30 text-amber-300 border-amber-500/50',
  
  vegetarian: 'bg-emerald-700/30 text-emerald-300 border-emerald-500/50',
  vegan: 'bg-teal-700/30 text-teal-300 border-teal-500/50',
  spicy: 'bg-rose-700/30 text-rose-300 border-rose-500/50',
  refreshing: 'bg-cyan-700/30 text-cyan-300 border-cyan-500/50',
  sharing: 'bg-indigo-700/30 text-indigo-300 border-indigo-500/50',

  beef: 'bg-pink-700/30 text-pink-300 border-pink-500/50',
  pasta: 'bg-lime-700/30 text-lime-300 border-lime-500/50',
  sweet: 'bg-fuchsia-700/30 text-fuchsia-300 border-fuchsia-500/50',
  fruit: 'bg-sky-700/30 text-sky-300 border-sky-500/50',
  sharable: 'bg-violet-700/30 text-violet-300 border-violet-500/50', // ensure no conflict with 'sharing'
  coffee: 'bg-stone-600/30 text-stone-300 border-stone-500/50',

  default: 'bg-gray-700/30 text-gray-300 border-gray-500/50',
};

const getTagStyleDark = (tag: string): string => {
  return tagColorMapDark[tag.toLowerCase().replace(/\s+/g, '').replace('-', '')] || tagColorMapDark.default;
};

export const AllergenTag: React.FC<AllergenTagProps> = ({ tag }) => {
  return (
    <span 
      className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getTagStyleDark(tag)}`}
    >
      {tag}
    </span>
  );
};
