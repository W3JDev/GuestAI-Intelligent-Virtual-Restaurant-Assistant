import React, { useState, FormEvent } from 'react';
import { GuestAiLogo } from './GuestAiLogo';
import { BookOpen, ShoppingCart, Users, Send, ChevronRight, CheckCircle } from 'lucide-react'; // Example icons

interface OnboardingFlowProps {
  currentStep: number;
  setCurrentStep: (step: number) => void;
  userName: string | null;
  onSetUserName: (name: string) => void;
  onOnboardingComplete: () => void;
}

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({
  currentStep,
  setCurrentStep,
  userName,
  onSetUserName,
  onOnboardingComplete,
}) => {
  const [nameInput, setNameInput] = useState(userName || '');
  const [animationClass, setAnimationClass] = useState('onboarding-screen-animate-in');
  const [stepAnimationClass, setStepAnimationClass] = useState('onboarding-step-animate-in');

  const handleNameSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (nameInput.trim()) {
      onSetUserName(nameInput.trim());
      setStepAnimationClass('onboarding-step-animate-out');
      setTimeout(() => {
        setCurrentStep(2);
        setStepAnimationClass('onboarding-step-animate-in');
      }, 300); // Match animation duration
    }
  };

  const handleNextStep = (nextStep: number) => {
    setStepAnimationClass('onboarding-step-animate-out');
    setTimeout(() => {
      setCurrentStep(nextStep);
      setStepAnimationClass('onboarding-step-animate-in');
    }, 300);
  };

  const handleFinishOnboarding = () => {
    setAnimationClass('onboarding-screen-animate-out');
    setTimeout(() => {
      onOnboardingComplete();
    }, 500); // Match screen fade out duration
  };
  
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className={`w-full max-w-md text-center ${stepAnimationClass}`}>
            <GuestAiLogo size={100} className="mx-auto mb-8" />
            <h1 className="text-3xl font-semibold text-brand-text-primary mb-3">Welcome to GUEST AI!</h1>
            <p className="text-brand-text-secondary mb-8">Your personal virtual assistant for Table & Apron. Let's get started by getting to know you.</p>
            <form onSubmit={handleNameSubmit} className="space-y-6">
              <div>
                <label htmlFor="userName" className="block text-sm font-medium text-brand-text-secondary mb-1">
                  What should I call you?
                </label>
                <input
                  type="text"
                  id="userName"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full px-4 py-3 bg-brand-surface-light border border-brand-border rounded-lg text-brand-text-primary focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none placeholder-brand-text-input-placeholder"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full flex items-center justify-center px-6 py-3 bg-brand-primary text-white rounded-lg font-semibold shadow-md hover:bg-brand-primary-variant focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-opacity-75 transition-all active:scale-95 text-base"
              >
                Continue <ChevronRight size={20} className="ml-2" />
              </button>
            </form>
          </div>
        );
      case 2:
        return (
          <div className={`w-full max-w-lg text-center ${stepAnimationClass}`}>
            <GuestAiLogo size={60} className="mx-auto mb-6" />
            <h1 className="text-2xl sm:text-3xl font-semibold text-brand-text-primary mb-3">
              Nice to meet you, <span className="gradient-text">{userName || 'Guest'}</span>!
            </h1>
            <p className="text-brand-text-secondary mb-8">
              I'm here to make your experience seamless. Here's how I can help:
            </p>
            <div className="space-y-4 text-left">
              <div className="flex items-start p-3 bg-brand-surface-light rounded-lg border border-brand-border/50">
                <BookOpen size={28} className="text-brand-secondary mr-4 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-brand-text-primary">Explore Our Menu</h3>
                  <p className="text-xs text-brand-text-secondary">Discover dishes, get details, and find recommendations.</p>
                </div>
              </div>
              <div className="flex items-start p-3 bg-brand-surface-light rounded-lg border border-brand-border/50">
                <ShoppingCart size={28} className="text-brand-secondary mr-4 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-brand-text-primary">Place Orders Effortlessly</h3>
                  <p className="text-xs text-brand-text-secondary">Add items, customize your selections, and schedule for later.</p>
                </div>
              </div>
              <div className="flex items-start p-3 bg-brand-surface-light rounded-lg border border-brand-border/50">
                <Users size={28} className="text-brand-secondary mr-4 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-brand-text-primary">Book a Table</h3>
                  <p className="text-xs text-brand-text-secondary">Request a reservation for your visit (simulated, call to finalize).</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => handleNextStep(3)}
              className="mt-10 w-full flex items-center justify-center px-6 py-3 bg-brand-primary text-white rounded-lg font-semibold shadow-md hover:bg-brand-primary-variant focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-opacity-75 transition-all active:scale-95 text-base"
            >
              Next <ChevronRight size={20} className="ml-2" />
            </button>
          </div>
        );
      case 3:
        return (
          <div className={`w-full max-w-md text-center ${stepAnimationClass}`}>
            <GuestAiLogo size={60} className="mx-auto mb-6" />
            <h1 className="text-2xl sm:text-3xl font-semibold text-brand-text-primary mb-3">How to Interact</h1>
            <p className="text-brand-text-secondary mb-6">
              Simply type your requests in the message bar below, or use the quick suggestion buttons that appear.
            </p>
            <div className="flex items-center justify-center p-4 bg-brand-surface-light rounded-lg border border-brand-border/50 mb-8">
              <Send size={24} className="text-brand-secondary mr-3" />
              <p className="text-sm text-brand-text-primary">"Show me the pasta menu" or "Add Latte to my order"</p>
            </div>
            <p className="text-brand-text-secondary mb-8">
              I'm ready when you are!
            </p>
            <button
              onClick={handleFinishOnboarding}
              className="w-full flex items-center justify-center px-6 py-3 bg-brand-secondary text-brand-bg-dark rounded-lg font-semibold shadow-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-brand-secondary focus:ring-opacity-75 transition-all active:scale-95 text-base"
            >
              Let's Get Started! <CheckCircle size={20} className="ml-2" />
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-brand-bg-dark p-4 sm:p-6 ${animationClass}`}>
      {renderStepContent()}
    </div>
  );
};
