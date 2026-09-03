import React, { createContext, useContext, useEffect, useState } from 'react';

type TextSize = 'normal' | 'large' | 'xlarge';
type ContrastLevel = 'normal' | 'high';

interface AccessibilityContextType {
  textSize: TextSize;
  setTextSize: (size: TextSize) => void;
  contrast: ContrastLevel;
  setContrast: (level: ContrastLevel) => void;
  reducedMotion: boolean;
  setReducedMotion: (reduced: boolean) => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [textSize, setTextSize] = useState<TextSize>(() => {
    return (localStorage.getItem('statiq_text_size') as TextSize) || 'normal';
  });
  
  const [contrast, setContrast] = useState<ContrastLevel>(() => {
    return (localStorage.getItem('statiq_contrast') as ContrastLevel) || 'normal';
  });

  const [reducedMotion, setReducedMotion] = useState<boolean>(() => {
    return localStorage.getItem('statiq_reduced_motion') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('statiq_text_size', textSize);
    document.documentElement.setAttribute('data-text-size', textSize);
  }, [textSize]);

  useEffect(() => {
    localStorage.setItem('statiq_contrast', contrast);
    document.documentElement.setAttribute('data-contrast', contrast);
  }, [contrast]);

  useEffect(() => {
    localStorage.setItem('statiq_reduced_motion', String(reducedMotion));
    if (reducedMotion) {
      document.documentElement.classList.add('reduced-motion');
    } else {
      document.documentElement.classList.remove('reduced-motion');
    }
  }, [reducedMotion]);

  return (
    <AccessibilityContext.Provider value={{
      textSize, setTextSize,
      contrast, setContrast,
      reducedMotion, setReducedMotion
    }}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
}
