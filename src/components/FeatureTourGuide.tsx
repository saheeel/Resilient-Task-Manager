import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useTasks } from '../contexts/TaskContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Calendar, ArrowRight, ArrowLeft, Check, X } from 'lucide-react';

interface TourStep {
  id: string;
  targetId?: string;
  titleEn: string;
  titleDe: string;
  descriptionEn: string;
  descriptionDe: string;
  badgeEn: string;
  badgeDe: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  iconBg: string;
  iconColor: string;
}

const ALL_TOUR_STEPS: TourStep[] = [
  {
    id: 'calendar_view',
    targetId: 'bottom-nav-calendar-btn',
    badgeEn: 'New Feature',
    badgeDe: 'Neue Funktion',
    titleEn: 'Interactive Calendar View',
    titleDe: 'Interaktive Kalenderansicht',
    descriptionEn: 'Visualize daily, weekly, and monthly recurring routines alongside deadlines in a dedicated calendar timeline in the bottom navigation.',
    descriptionDe: 'Sehen Sie tägliche, wöchentliche und monatliche Routinen sowie Fristen in einer interaktiven Kalenderübersicht in der unteren Navigationsleiste.',
    icon: Calendar,
    iconBg: 'bg-blue-500/10 dark:bg-blue-500/20 border border-blue-500/20',
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
];

export const FeatureTourGuide: React.FC = () => {
  const { currentUser } = useTasks();
  const { language } = useLanguage();
  const location = useLocation();

  const [isOpen, setIsOpen] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  // Storage key is scoped to the user ID
  const storageKey = currentUser ? `rtm_feature_tour_v1_seen_${currentUser.id}` : 'rtm_feature_tour_v1_seen';

  const tourSteps = useMemo(() => {
    if (!currentUser) return [];
    return ALL_TOUR_STEPS;
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser || tourSteps.length === 0) return;

    // Check if this specific user has already seen the one-time walkthrough
    const hasSeen = localStorage.getItem(storageKey) === 'true';
    if (!hasSeen) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [currentUser, storageKey, tourSteps.length]);

  const currentStep = tourSteps[currentStepIndex] || tourSteps[0];

  // Calculate spotlight position for targeted elements
  useEffect(() => {
    if (!isOpen || !currentStep?.targetId) {
      setTargetRect(null);
      return;
    }

    const updateRect = () => {
      const el = document.getElementById(currentStep.targetId!);
      if (el) {
        setTargetRect(el.getBoundingClientRect());
      } else {
        setTargetRect(null);
      }
    };

    updateRect();
    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect);

    return () => {
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect);
    };
  }, [isOpen, currentStepIndex, currentStep, location.pathname]);

  if (!currentUser || !isOpen || tourSteps.length === 0) return null;

  const isLastStep = currentStepIndex === tourSteps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      handleDismiss();
    } else {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleDismiss = () => {
    try {
      localStorage.setItem(storageKey, 'true');
    } catch {
      // ignore storage error
    }
    setIsOpen(false);
  };

  const StepIcon = currentStep.icon;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-auto">
      {/* Clear non-blurred subtle backdrop to keep background UI fully visible */}
      <div 
        onClick={handleDismiss} 
        className="absolute inset-0 bg-slate-900/15 dark:bg-black/30 transition-opacity animate-in fade-in duration-300"
      />

      {/* Target Element Spotlight Halo if element exists */}
      {targetRect && (
        <div
          className="fixed pointer-events-none transition-all duration-300 rounded-xl ring-4 ring-blue-500/90 ring-offset-2 ring-offset-white dark:ring-offset-slate-900 shadow-[0_0_20px_rgba(59,130,246,0.6)]"
          style={{
            top: targetRect.top - 4,
            left: targetRect.left - 4,
            width: targetRect.width + 8,
            height: targetRect.height + 8,
            zIndex: 101,
          }}
        >
          <span className="absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-blue-500"></span>
          </span>
        </div>
      )}

      {/* Modal Dialog Box */}
      <div 
        className="relative z-[102] max-w-md w-[calc(100vw-2rem)] mx-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 sm:p-7 shadow-2xl animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border-none bg-transparent cursor-pointer"
          title="Dismiss"
        >
          <X size={18} />
        </button>

        {/* Step Badge & Counter */}
        <div className="flex items-center justify-between gap-2 mb-4 pr-8">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            {language === 'de' ? currentStep.badgeDe : currentStep.badgeEn}
          </span>
          {tourSteps.length > 1 && (
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
              {currentStepIndex + 1} / {tourSteps.length}
            </span>
          )}
        </div>

        {/* Icon & Content */}
        <div className="flex items-start gap-4 mb-5">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${currentStep.iconBg} ${currentStep.iconColor}`}>
            <StepIcon size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-snug tracking-tight mb-1.5">
              {language === 'de' ? currentStep.titleDe : currentStep.titleEn}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {language === 'de' ? currentStep.descriptionDe : currentStep.descriptionEn}
            </p>
          </div>
        </div>

        {/* Step Progress Indicator Dots if multiple steps */}
        {tourSteps.length > 1 && (
          <div className="flex items-center justify-center gap-1.5 mb-6">
            {tourSteps.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentStepIndex(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 border-none cursor-pointer ${
                  idx === currentStepIndex
                    ? 'w-7 bg-blue-600 dark:bg-blue-500'
                    : 'w-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300'
                }`}
                aria-label={`Go to step ${idx + 1}`}
              />
            ))}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div>
            {currentStepIndex > 0 ? (
              <button
                type="button"
                onClick={handlePrev}
                className="flex items-center gap-1 px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800/60 rounded-xl transition-colors cursor-pointer border-none"
              >
                <ArrowLeft size={14} />
                <span>{language === 'de' ? 'Zurück' : 'Back'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleDismiss}
                className="px-3 py-2 text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 bg-transparent rounded-xl transition-colors cursor-pointer border-none"
              >
                {language === 'de' ? 'Überspringen' : 'Skip'}
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={handleNext}
            className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer border-none"
          >
            {isLastStep ? (
              <>
                <Check size={14} />
                <span>{language === 'de' ? 'Verstanden!' : 'Got it!'}</span>
              </>
            ) : (
              <>
                <span>{language === 'de' ? 'Weiter' : 'Next'}</span>
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeatureTourGuide;
