
import React from 'react';
import { Phone, MessageCircle } from 'lucide-react'; // Using MessageCircle as a generic messaging icon

interface ContactActionsCardProps {
  restaurantPhoneNumber: string;
  restaurantWhatsAppNumber: string; // Should be in international format without '+' or spaces for wa.me link
}

export const ContactActionsCard: React.FC<ContactActionsCardProps> = ({
  restaurantPhoneNumber,
  restaurantWhatsAppNumber,
}) => {
  return (
    <div className="mt-3 p-3 bg-brand-surface-light rounded-lg border border-brand-border/50 shadow-sm">
      <h4 className="text-xs font-semibold text-brand-text-secondary uppercase tracking-wider mb-2 text-center">Need to Follow Up?</h4>
      <div className="flex flex-col sm:flex-row sm:space-x-2 space-y-2 sm:space-y-0">
        <a
          href={`tel:${restaurantPhoneNumber}`}
          className="flex-1 flex items-center justify-center px-3 py-2.5 bg-brand-secondary/20 text-brand-secondary rounded-md font-medium text-sm hover:bg-brand-secondary/30 focus:outline-none focus:ring-2 focus:ring-brand-secondary transition-all active:scale-95"
          aria-label={`Call us at ${restaurantPhoneNumber}`}
        >
          <Phone size={16} className="mr-2" />
          Call Us
        </a>
        <a
          href={`https://wa.me/${restaurantWhatsAppNumber}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center px-3 py-2.5 bg-green-500/20 text-green-400 rounded-md font-medium text-sm hover:bg-green-500/30 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all active:scale-95"
          aria-label={`WhatsApp us at ${restaurantWhatsAppNumber}`}
        >
          <MessageCircle size={16} className="mr-2" /> {/* Or a more specific WhatsApp icon if available */}
          WhatsApp Us
        </a>
      </div>
    </div>
  );
};
