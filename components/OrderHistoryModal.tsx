
import React, { useState, useEffect } from 'react';
import { HistoricalOrder, OrderItem } from '../types';
import { X, ShoppingBag, CalendarClock, RotateCcw, ListOrdered, BadgeCheck } from 'lucide-react'; // Using BadgeCheck for confirmation

interface OrderHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  pastOrders: HistoricalOrder[];
  onReorder: (orderId: string) => void;
}

const formatOrderTimestamp = (isoTimestamp: string): string => {
  return new Date(isoTimestamp).toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true
  });
};

const formatScheduledTime = (isoTimestamp?: string | null): string | null => {
  if (!isoTimestamp) return null;
  return new Date(isoTimestamp).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true
  });
};

const PastOrderItem: React.FC<{ item: OrderItem }> = ({ item }) => {
  const optionsString = item.selected_options.map(opt => `${opt.option_name}: ${opt.value}`).join(', ');
  const modifiersString = item.applied_modifiers.map(mod => mod.mod_name).join(', ');

  return (
    <div className="py-1.5 border-b border-brand-border/30 last:border-b-0">
      <div className="flex justify-between items-start text-xs">
        <div className="flex-1 mr-2">
          <span className="font-medium text-brand-text-primary">{item.item_name} (x{item.quantity})</span>
          {optionsString && <p className="text-brand-text-secondary/80 text-[0.65rem] leading-tight">Options: {optionsString}</p>}
          {modifiersString && <p className="text-brand-text-secondary/80 text-[0.65rem] leading-tight">Mods: {modifiersString}</p>}
        </div>
        <span className="font-semibold text-brand-secondary/90">RM{item.final_item_price.toFixed(2)}</span>
      </div>
    </div>
  );
};


export const OrderHistoryModal: React.FC<OrderHistoryModalProps> = ({
  isOpen,
  onClose,
  pastOrders,
  onReorder,
}) => {
  const [isRendered, setIsRendered] = useState(false);
  const [animationClass, setAnimationClass] = useState('');

  useEffect(() => {
    let timerId: number;
    if (isOpen) {
      setIsRendered(true);
      timerId = window.setTimeout(() => setAnimationClass('modal-animate-in'), 10);
    } else if (isRendered && !isOpen) {
      setAnimationClass('modal-animate-out');
      timerId = window.setTimeout(() => {
        setIsRendered(false);
        setAnimationClass('');
      }, 300);
    }
    return () => window.clearTimeout(timerId);
  }, [isOpen, isRendered]);

  if (!isRendered && animationClass === '') return null;

  return (
    <div
      className={`modal-container fixed inset-0 z-40 p-4 flex items-center justify-center ${animationClass}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="order-history-modal-title"
    >
      <div className="modal-backdrop-overlay fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose}></div>
      <div
        className="modal-content-panel relative bg-brand-surface-dark w-full max-w-md rounded-xl shadow-xl border border-brand-border flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 border-b border-brand-border">
          <h2 id="order-history-modal-title" className="text-lg font-semibold text-brand-text-primary flex items-center">
            <ListOrdered size={20} className="mr-2.5 text-brand-primary" /> Order History
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-brand-surface-light text-brand-text-secondary focus:outline-none focus:ring-2 focus:ring-brand-primary active:scale-90 transition-transform"
            aria-label="Close order history modal"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-3 sm:p-4 space-y-3 overflow-y-auto flex-grow">
          {pastOrders.length === 0 ? (
            <p className="text-brand-text-secondary text-sm text-center py-10">No past orders found.</p>
          ) : (
            pastOrders.map((order) => (
              <div key={order.id} className="bg-brand-surface-light p-3 rounded-lg shadow-sm border border-brand-border/50">
                <div className="flex justify-between items-start mb-1.5 pb-1.5 border-b border-brand-border/30">
                  <div>
                    <p className="text-xs text-brand-text-secondary">{formatOrderTimestamp(order.timestamp)}</p>
                    {order.scheduledFor && (
                       <p className="text-xs text-brand-secondary flex items-center mt-0.5">
                         <CalendarClock size={12} className="mr-1 opacity-80" /> Scheduled: {formatScheduledTime(order.scheduledFor)}
                       </p>
                    )}
                  </div>
                  <p className="text-sm font-bold text-brand-primary">RM{order.subtotal.toFixed(2)}</p>
                </div>
                {order.confirmationCode && (
                    <div className="mb-1.5 flex items-center text-xs text-brand-primary/80 bg-brand-primary/10 px-2 py-1 rounded-md">
                        <BadgeCheck size={14} className="mr-1.5 text-brand-primary" /> 
                        Conf. Code: <span className="font-semibold ml-1">{order.confirmationCode}</span>
                    </div>
                )}
                <div className="space-y-1 mb-2 max-h-32 overflow-y-auto pr-1">
                  {order.items.map((item, index) => (
                    <PastOrderItem key={`${item.item_id}-${index}`} item={item} />
                  ))}
                </div>
                <button
                  onClick={() => onReorder(order.id)}
                  className="w-full mt-1 px-3 py-1.5 bg-brand-primary/20 text-brand-primary text-xs font-semibold rounded-md hover:bg-brand-primary/30 focus:outline-none focus:ring-1 focus:ring-brand-primary transition-colors active:scale-95 flex items-center justify-center"
                >
                  <RotateCcw size={12} className="mr-1.5" /> Re-order
                </button>
              </div>
            ))
          )}
        </div>
        
        <div className="p-3 border-t border-brand-border text-center">
             <button
                onClick={onClose}
                className="px-4 py-2 bg-brand-primary text-white rounded-lg text-sm font-medium shadow-sm hover:bg-brand-primary-variant focus:outline-none focus:ring-2 focus:ring-brand-primary transition-all active:scale-95"
              >
                Close
              </button>
        </div>
      </div>
    </div>
  );
};
