
import { useState, useCallback } from 'react';
import { OrderItem as OrderItemType } from '../types';

export const useOrderManagement = () => {
  const [currentOrder, setCurrentOrder] = useState<OrderItemType[]>([]);
  const [orderSubtotal, setOrderSubtotal] = useState<number>(0);
  const [orderScheduledDateTime, setOrderScheduledDateTime] = useState<string | null>(null);
  const [isScheduledOrderActive, setIsScheduledOrderActive] = useState<boolean>(false);
  const [confirmedSchedule, setConfirmedSchedule] = useState<string | null>(null);

  const handleScheduleOrderDateTimeChange = useCallback((dateTime: string | null) => {
    setOrderScheduledDateTime(dateTime);
    if (dateTime) {
      setIsScheduledOrderActive(true);
    } else {
      setIsScheduledOrderActive(false);
    }
    if (!dateTime && currentOrder.length === 0) {
      setConfirmedSchedule(null);
    }
  }, [currentOrder.length]);

  const resetOrderState = useCallback(() => {
    setCurrentOrder([]);
    setOrderSubtotal(0);
    setOrderScheduledDateTime(null);
    setIsScheduledOrderActive(false);
    setConfirmedSchedule(null);
  }, []);

  const updateOrderStateFromAI = useCallback((
    newOrder: OrderItemType[], 
    newSubtotal: number, 
    newScheduledFor?: string, 
    _unusedConfirmedScheduleParam?: string, 
    orderSummaryReceipt?: string
  ) => {
    // Safeguard: Ensure newOrder is an array and newSubtotal is a number
    setCurrentOrder(Array.isArray(newOrder) ? newOrder : []);
    setOrderSubtotal(typeof newSubtotal === 'number' ? newSubtotal : 0);

    if (newScheduledFor) { 
        setOrderScheduledDateTime(newScheduledFor); 
        setConfirmedSchedule(newScheduledFor);    
        setIsScheduledOrderActive(true);        
    }
    
    if (orderSummaryReceipt){ 
        setIsScheduledOrderActive(false); 
    } else if (!newScheduledFor && (!Array.isArray(newOrder) || newOrder.length === 0)) { 
        // Check explicitly if newOrder (after potential validation) is empty
        setOrderScheduledDateTime(null);
        setConfirmedSchedule(null);
        setIsScheduledOrderActive(false);
    }

  }, []); // Removed currentOrder.length dependency as it's not directly used for logic here, state is self-contained.


  return {
    currentOrder,
    orderSubtotal,
    orderScheduledDateTime,
    isScheduledOrderActive,
    confirmedSchedule,
    setCurrentOrder, 
    setOrderSubtotal, 
    setOrderScheduledDateTime, 
    setIsScheduledOrderActive, 
    setConfirmedSchedule, 
    handleScheduleOrderDateTimeChange,
    resetOrderState,
    updateOrderStateFromAI,
  };
};
