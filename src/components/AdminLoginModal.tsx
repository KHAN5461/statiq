import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Shield, Lock, Eye, EyeOff, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { useNavigate } from 'react-router-dom';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdminLoginModal({ isOpen, onClose }: AdminLoginModalProps) {
  const [passcode, setPasscode] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Secure Passcode Validation (StatIQ Admin Secret: "Karmayogi2026")
    if (passcode.trim() !== 'Karmayogi2026') {
      setError('Invalid administrative passcode. Please enter a valid credential key.');
      return;
    }

    setIsLoading(true);
    try {
      // Simulate/Sign in as Admin
      await signInWithGoogle('admin');
      navigate('/admin');
      onClose();
    } catch (err: any) {
      console.error('Admin authentication failure:', err);
      if (err?.code === 'auth/popup-closed-by-user' || err?.message?.includes('popup-closed-by-user')) {
        setError('Authentication cancelled because the sign-in window was closed.');
      } else {
        setError(err.message || 'Authentication failed. Please verify connection credentials.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className="relative w-full max-w-md overflow-hidden bg-white dark:bg-slate-900 rounded-[24px] border border-slate-100 dark:border-slate-800 shadow-2xl p-6 md:p-8 z-10"
          >
            {/* Header / Brand */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30">
                  <Shield size={24} />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-lg tracking-tight">Admin Gateway</h3>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">Karmayogi StatIQ Central Dashboard</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-full hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                aria-label="Close gateway"
              >
                <X size={18} />
              </button>
            </div>

            <div className="bg-amber-50/50 dark:bg-amber-950/10 border border-amber-100/70 dark:border-amber-900/20 rounded-xl p-4 mb-6">
              <p className="text-xs font-medium text-amber-800 dark:text-amber-300 leading-relaxed">
                This secure portal is reserved for MoSPI administrative and training staff to deploy assessments and access aggregated cohort telemetry.
              </p>
              <div className="mt-2 text-[10px] text-amber-600 dark:text-amber-400/80 font-bold">
                🔑 Sandbox Passcode: <code className="bg-white/80 dark:bg-black/30 px-1.5 py-0.5 rounded font-mono border border-amber-200/50">Karmayogi2026</code>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleAdminSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400" htmlFor="passcode-field">
                  Administrative Credentials Key
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <Lock size={16} />
                  </span>
                  <input
                    id="passcode-field"
                    type={showPasscode ? 'text' : 'password'}
                    value={passcode}
                    onChange={(e) => {
                      setPasscode(e.target.value);
                      setError(null);
                    }}
                    placeholder="Enter admin passcode"
                    className="w-full pl-10 pr-10 py-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-medium transition-all"
                    required
                    disabled={isLoading}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasscode(!showPasscode)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                  >
                    {showPasscode ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Error Callout */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-2 p-3 bg-rose-50 dark:bg-rose-950/20 text-rose-800 dark:text-rose-300 rounded-xl border border-rose-100 dark:border-rose-900/30 text-xs font-semibold leading-relaxed"
                >
                  <AlertCircle size={14} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col gap-2 pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                >
                  {isLoading ? 'Verifying Gateway...' : 'Authenticate & Enter'}
                  {!isLoading && <ArrowRight size={16} />}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isLoading}
                  className="w-full py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-sm rounded-xl transition-colors text-center"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
