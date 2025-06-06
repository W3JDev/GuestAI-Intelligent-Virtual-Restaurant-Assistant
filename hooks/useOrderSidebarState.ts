import { useState, useEffect, useCallback, ChangeEvent } from 'react';

export const useOrderSidebarState = (
  initialIsScheduledOrderActive: boolean,
  initialScheduledDateTime: string | null,
  onScheduleOrderDateTimeChange: (dateTime: string | null) => void
) => {
  const [isScheduling, setIsScheduling] = useState(initialIsScheduledOrderActive);
  const [dateInput, setDateInput] = useState('');
  const [timeInput, setTimeInput] = useState('');

  useEffect(() => {
    setIsScheduling(initialIsScheduledOrderActive);
    if (initialScheduledDateTime) {
      const [datePart, timePartWithSeconds] = initialScheduledDateTime.split(' ');
      const timePart = timePartWithSeconds?.substring(0,5); // Ensure HH:MM format
      setDateInput(datePart || '');
      setTimeInput(timePart || '');
    } else {
      setDateInput('');
      setTimeInput('');
    }
  }, [initialIsScheduledOrderActive, initialScheduledDateTime]);

  const propagateDateTimeChange = useCallback(() => {
    if (dateInput && timeInput && isScheduling) {
      onScheduleOrderDateTimeChange(`${dateInput} ${timeInput}`);
    } else if (!isScheduling) {
      onScheduleOrderDateTimeChange(null);
    }
    // If only one is set while scheduling, don't propagate incomplete time
    // This case is handled by the confirm button's disabled state
  }, [dateInput, timeInput, isScheduling, onScheduleOrderDateTimeChange]);

  useEffect(() => {
    propagateDateTimeChange();
  }, [dateInput, timeInput, isScheduling, propagateDateTimeChange]);


  const handleScheduleToggle = useCallback(() => {
    const newIsScheduling = !isScheduling;
    setIsScheduling(newIsScheduling);
    if (!newIsScheduling) {
      setDateInput('');
      setTimeInput('');
      onScheduleOrderDateTimeChange(null); // Explicitly clear via prop
    } else {
      // If toggling on and date/time are not set, set defaults
      if (!dateInput && !timeInput) {
        const today = new Date();
        const defaultDate = today.toISOString().split('T')[0];
        // Default time: next hour, rounded to 00 or 30 minutes.
        let defaultHour = today.getHours() + 1;
        let defaultMinutes = today.getMinutes();
        if (defaultMinutes < 15) defaultMinutes = 30;
        else if (defaultMinutes < 45) { defaultHour +=1; defaultMinutes = 0; }
        else { defaultHour += 1; defaultMinutes = 30; }

        if (defaultHour >= 24) defaultHour = 23; // cap at 23 to avoid date roll-over issues simply
        if (defaultMinutes >= 60) defaultMinutes = 30;


        const defaultTime = `${String(defaultHour).padStart(2, '0')}:${String(defaultMinutes).padStart(2, '0')}`;

        setDateInput(defaultDate);
        setTimeInput(defaultTime);
        // propagateDateTimeChange will be called by useEffect due to state changes
      }
      // If already set, propagateDateTimeChange ensures App.tsx is notified
    }
  }, [isScheduling, dateInput, timeInput, onScheduleOrderDateTimeChange]);

  const handleDateInputChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setDateInput(event.target.value);
  }, []);

  const handleTimeInputChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setTimeInput(event.target.value);
  }, []);

  const clearScheduleInputs = useCallback(() => {
    setDateInput('');
    setTimeInput('');
    // If isScheduling is true, it means user actively cleared.
    // We should then turn scheduling off or just clear inputs and let user toggle.
    // Current behavior: just clears inputs, propagateDateTimeChange will send null if !isScheduling.
    // If isScheduling is true, and inputs are cleared, button will be disabled.
    // If we want to also toggle `isScheduling` off:
    // setIsScheduling(false); // This would also trigger propagateDateTimeChange
    onScheduleOrderDateTimeChange(null); // Ensure App state is updated to null if cleared
  }, [onScheduleOrderDateTimeChange]);


  return {
    isScheduling,
    dateInput,
    timeInput,
    setIsScheduling,
    setDateInput,
    setTimeInput,
    handleScheduleToggle,
    handleDateInputChange,
    handleTimeInputChange,
    clearScheduleInputs,
  };
};