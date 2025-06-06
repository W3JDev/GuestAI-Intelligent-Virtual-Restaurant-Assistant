
import React from 'react';
import { OrderItem } from '../types';
import { X, ShoppingCart, CheckCircle, CalendarDays, Clock, Trash2 } from 'lucide-react';
import { useOrderSidebarState } from '../hooks/useOrderSidebarState';

interface OrderSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentOrder: OrderItem[];
  orderSubtotal: number;
  onConfirmOrder: () => void;
  isScheduledOrderActive: boolean;
  scheduledDateTime: string | null;
  onScheduleOrderDateTimeChange: (dateTime: string | null) => void;
  confirmedSchedule: string | null;
}

const SidebarOrderItemCard: React.FC<{ item: OrderItem }> = ({ item }) => {
  return (
    <div className="p-2 bg-brand-surface-light rounded-md shadow-sm">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm font-medium text-brand-text-primary">{item.item_name} (x{item.quantity})</p>
          {item.selected_options.length > 0 && (
            <p className="text-xs text-brand-text-secondary">
              {item.selected_options.map(opt => `${opt.option_name}: ${opt.value}`).join(', ')}
            </p>
          )}
          {item.applied_modifiers.length > 0 && (
             <p className="text-xs text-brand-text-secondary">
              {item.applied_modifiers.map(mod => mod.mod_name).join(', ')}
            </p>
          )}
        </div>
        <p className="text-sm font-semibold text-brand-secondary">RM {item.final_item_price.toFixed(2)}</p>
      </div>
    </div>
  );
};

export const OrderSidebar: React.FC<OrderSidebarProps> = ({ 
  isOpen, 
  onClose, 
  currentOrder, 
  orderSubtotal, 
  onConfirmOrder,
  isScheduledOrderActive: initialIsScheduledOrderActive,
  scheduledDateTime: initialScheduledDateTime,
  onScheduleOrderDateTimeChange,
  confirmedSchedule
}) => {
  const {
    isScheduling,
    dateInput,
    timeInput,
    handleScheduleToggle,
    handleDateInputChange,
    handleTimeInputChange,
    clearScheduleInputs,
  } = useOrderSidebarState(
    initialIsScheduledOrderActive,
    initialScheduledDateTime,
    onScheduleOrderDateTimeChange
  );

  if (!isOpen) return null;

  let displayScheduledTime = null;
  if (confirmedSchedule) {
    const scheduleDate = new Date(confirmedSchedule);
    displayScheduledTime = isNaN(scheduleDate.getTime()) ? confirmedSchedule : scheduleDate.toLocaleString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true
    });
  }

  return (
    <div 
      className={`fixed inset-y-0 left-0 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
                  w-full sm:w-80 md:w-96 bg-brand-surface-dark shadow-xl z-30 transition-transform duration-300 ease-in-out 
                  flex flex-col border-r border-brand-border`}
      aria-modal="true"
      role="dialog"
    >
      {/* Sidebar Header */}
      <div className="p-4 flex justify-between items-center border-b border-brand-border">
        <h2 className="text-lg font-semibold text-brand-text-primary flex items-center">
          <ShoppingCart size={20} className="mr-2 text-brand-primary" />
          Your Order
        </h2>
        <button 
          onClick={onClose} 
          className="p-1.5 rounded-md hover:bg-brand-surface-light text-brand-text-secondary focus:outline-none focus:ring-2 focus:ring-brand-primary active:scale-90 transition-transform"
          aria-label="Close order sidebar"
        >
          <X size={20} />
        </button>
      </div>

      {/* Order Items List */}
      <div className="flex-grow p-4 space-y-3 overflow-y-auto">
        {currentOrder.length === 0 ? (
          <p className="text-brand-text-secondary text-sm text-center mt-4">Your order is currently empty.</p>
        ) : (
          currentOrder.map((item, index) => (
            <SidebarOrderItemCard key={`${item.item_id}-${index}-${item.item_name}`} item={item} />
          ))
        )}
      </div>

      {/* Scheduling Section */}
      <div className="p-4 border-t border-brand-border">
        <label htmlFor="scheduleToggle" className="flex items-center cursor-pointer mb-2 group">
          <input 
            type="checkbox" 
            id="scheduleToggle"
            checked={isScheduling}
            onChange={handleScheduleToggle}
            className="mr-2 h-4 w-4 rounded border-brand-border text-brand-primary focus:ring-brand-primary bg-brand-surface-dark group-hover:ring-1 group-hover:ring-brand-primary transition-all"
          />
          <span className="text-sm font-medium text-brand-text-primary group-hover:text-brand-primary transition-colors">Order for Later?</span>
        </label>

        {isScheduling && (
          <div className="space-y-2 mb-3 pl-6">
            <div className="flex items-center space-x-2">
              <CalendarDays size={18} className="text-brand-text-secondary" />
              <input 
                type="date" 
                value={dateInput}
                onChange={handleDateInputChange}
                className="p-2 bg-brand-surface-light border border-brand-border rounded-md text-sm text-brand-text-primary focus:ring-2 focus:ring-brand-primary w-full"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Clock size={18} className="text-brand-text-secondary" />
              <input 
                type="time" 
                value={timeInput}
                onChange={handleTimeInputChange}
                className="p-2 bg-brand-surface-light border border-brand-border rounded-md text-sm text-brand-text-primary focus:ring-2 focus:ring-brand-primary w-full"
              />
            </div>
             <button
                onClick={clearScheduleInputs}
                className="text-xs text-brand-primary hover:underline flex items-center mt-1 active:scale-95 transition-transform"
              >
                <Trash2 size={12} className="mr-1" /> Clear Schedule
              </button>
          </div>
        )}
         {displayScheduledTime && !isScheduling && currentOrder.length > 0 && (
          <div className="mb-2 text-xs text-brand-secondary flex items-center pl-1">
            <CalendarDays size={14} className="mr-1.5 text-brand-primary" />
            Order currently scheduled for: {displayScheduledTime}
          </div>
        )}
      </div>

      {/* Order Summary & Actions */}
      {currentOrder.length > 0 && (
        <div className="p-4 border-t border-brand-border mt-auto bg-brand-surface-dark rounded-b-xl">
          <div className="flex justify-between items-center mb-3">
            <p className="text-md font-semibold text-brand-text-primary">Subtotal:</p>
            <p className="text-lg font-bold text-brand-secondary">RM {orderSubtotal.toFixed(2)}</p>
          </div>
          <button
            onClick={() => {
              onConfirmOrder(); 
              onClose(); 
            }}
            className="w-full flex items-center justify-center px-4 py-2.5 bg-brand-primary text-white rounded-lg font-semibold shadow-md hover:bg-brand-primary-variant focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-opacity-75 transition-all active:scale-95 disabled:opacity-60"
            aria-disabled={currentOrder.length === 0 || (isScheduling && (!dateInput || !timeInput))}
            disabled={currentOrder.length === 0 || (isScheduling && (!dateInput || !timeInput))}
          >
            <CheckCircle size={18} className="mr-2" />
            {isScheduling && dateInput && timeInput ? 'Confirm Scheduled Order' : 'Confirm Order Now'}
          </button>
        </div>
      )}
    </div>
  );
};