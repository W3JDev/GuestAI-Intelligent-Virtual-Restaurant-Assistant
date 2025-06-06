import React, { useEffect, useRef } from 'react';
import { MessageSquarePlus } from 'lucide-react'; // Or another icon for New Chat

interface HeaderActionMenuProps {
  onClose: () => void;
  onNewChat: () => void;
  anchorEl: HTMLButtonElement | null; // The button that triggered the menu
}

export const HeaderActionMenu: React.FC<HeaderActionMenuProps> = ({ onClose, onNewChat, anchorEl }) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node) && anchorEl && !anchorEl.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose, anchorEl]);

  const handleNewChatClick = () => {
    onNewChat();
    onClose();
  };
  
  // Basic positioning logic - can be improved with a popper library
  let menuStyle: React.CSSProperties = {
    position: 'absolute',
    top: '100%', // Position below the anchor
    right: 0,   // Align to the right of the anchor's parent
    marginTop: '8px', // Some spacing
  };

  if (anchorEl) {
    const rect = anchorEl.getBoundingClientRect();
    // More precise positioning could be done here if needed
  }


  return (
    <div
      ref={menuRef}
      style={menuStyle}
      className="bg-brand-surface-dark border border-brand-border rounded-lg shadow-xl w-48 z-50 py-1 origin-top-right animate-modalContentScaleUpFadeIn" // Using existing modal animation for entry
      role="menu"
      aria-orientation="vertical"
      aria-labelledby="header-action-menu-button" // Assume anchorEl has this id
    >
      <button
        onClick={handleNewChatClick}
        className="w-full flex items-center px-3 py-2 text-sm text-brand-text-primary hover:bg-brand-surface-light hover:text-brand-primary transition-colors focus:outline-none focus:bg-brand-surface-light active:scale-95"
        role="menuitem"
      >
        <MessageSquarePlus size={16} className="mr-2.5" />
        New Chat
      </button>
      {/* Add more menu items here if needed */}
    </div>
  );
};
