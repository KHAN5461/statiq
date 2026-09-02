import React, { useState } from 'react';
import { usePWAInstall } from '../lib/usePWAInstall';
import { Download, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'button' | 'icon';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ className = '', variant = 'button' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    if (variant === 'icon') {
       return (
         <button onClick={install} title="Install App" className={`p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors ${className}`}>
           <Download size={20} />
         </button>
       );
    }
    return (
      <button
        onClick={install}
        className={`flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-light transition-colors active:scale-95 ${className}`}
      >
        <Download size={16} />
        Install App
      </button>
    );
  }

  if (isIOS) {
    if (variant === 'icon') {
       return (
         <>
           <button onClick={() => setShowIOSGuide(true)} title="Install App" className={`p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors ${className}`}>
             <Download size={20} />
           </button>
           {showIOSGuide && <IOSGuideModal onClose={() => setShowIOSGuide(false)} />}
         </>
       );
    }
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className={`flex items-center gap-2 rounded-full border border-border-color bg-surface px-4 py-2 text-sm font-medium text-slate-700 hover:bg-background transition-colors active:scale-95 shadow-sm ${className}`}
        >
          <Download size={16} />
          Install on iOS
        </button>

        {showIOSGuide && <IOSGuideModal onClose={() => setShowIOSGuide(false)} />}
      </>
    );
  }

  return null;
};

const IOSGuideModal = ({ onClose }: { onClose: () => void }) => (
  <AnimatePresence>
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-sm rounded-[20px] bg-surface p-6 shadow-2xl border border-border-color"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-900">Install on iPhone / iPad</h3>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>
        <p className="mt-2 text-sm text-slate-600 font-medium">
          1. Tap the <strong>Share</strong> button in the Safari toolbar.<br /><br />
          2. Scroll down and tap <strong>Add to Home Screen</strong>.
        </p>
        <button
          onClick={onClose}
          className="mt-6 w-full rounded-full bg-slate-100 py-3 text-sm font-bold text-slate-800 hover:bg-slate-200 transition-colors"
        >
          Got it
        </button>
      </motion.div>
    </div>
  </AnimatePresence>
);
