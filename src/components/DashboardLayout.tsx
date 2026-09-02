import React, { useState } from 'react';
import { ViewState } from '../types';
import { 
  LayoutDashboard, 
  FileText, 
  CheckSquare, 
  BarChart2, 
  Settings, 
  HelpCircle,
  Menu,
  Bell,
  X,
  LogOut,
  Search,
  User as UserIcon,
  Moon,
  Sun,
  RefreshCw,
  ShieldAlert,
  Key
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../lib/AuthContext';
import { useTheme } from '../lib/ThemeContext';
import { PWAInstallButton } from './PWAInstallButton';
import { useOnlineStatus } from '../lib/usePWAInstall';

const OfflineIndicator = () => {
  const isOnline = useOnlineStatus();
  if (isOnline) return null;
  return (
    <div className="fixed bottom-4 left-4 z-[60] flex items-center gap-2 rounded-full bg-amber-500 px-4 py-2 text-xs font-bold text-white shadow-lg border border-amber-600">
      <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
      Offline Mode — Cached data is being used
    </div>
  );
};

interface DashboardLayoutProps {
  currentView: ViewState;
  setCurrentView: (view: ViewState) => void;
  children: React.ReactNode;
}

export function DashboardLayout({ currentView, setCurrentView, children }: DashboardLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isClaimsPanelOpen, setIsClaimsPanelOpen] = useState(false);
  const { user, role, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };


  const handleLogout = async () => {
    await logout();
    setCurrentView('landing');
  };

  const navItems = [
    { id: 'learner' as ViewState, label: 'Learner', icon: LayoutDashboard, roles: ['admin', 'learner'] },
    { id: 'generator' as ViewState, label: 'Generator', icon: FileText, roles: ['admin'] },
    { id: 'assessment' as ViewState, label: 'Assessment', icon: CheckSquare, roles: ['admin', 'learner'] },
    { id: 'admin' as ViewState, label: 'Admin', icon: BarChart2, roles: ['admin'] },
  ];

  const visibleNavItems = navItems.filter(item => !role || item.roles.includes(role));

  const effectivelyCollapsed = isSidebarCollapsed && !mobileMenuOpen;

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-background antialiased font-sans">
      {/* TopNavBar (Mobile Only) */}
      <header className="md:hidden bg-surface dark:bg-slate-900 border-b border-border-color fixed top-0 w-full z-50 flex justify-between items-center px-6 h-16 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-xl text-primary font-bold">Karmayogi StatIQ</span>
        </div>
        <div className="flex items-center gap-2">
          <PWAInstallButton variant="icon" className="mr-1" />
          <button onClick={() => setMobileMenuOpen(true)} className="p-2 text-slate-500">
            <Menu size={24} />
          </button>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 md:hidden" 
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* SideNavBar (Desktop) */}
      <nav className={`
        fixed inset-y-0 left-0 z-50 bg-surface dark:bg-slate-900 border-r border-border-color flex flex-col p-4 transform transition-all duration-300 shadow-2xl md:shadow-none
        ${mobileMenuOpen ? 'translate-x-0 w-[280px]' : '-translate-x-full md:translate-x-0'}
        ${effectivelyCollapsed ? 'md:w-[88px]' : 'md:w-[280px]'}
      `}>
        {/* Header */}
        <div className={`flex mb-8 mt-2 ${effectivelyCollapsed ? 'flex-col items-center gap-6 px-0' : 'items-center justify-between px-1'}`}>
          <div className={`flex items-center ${effectivelyCollapsed ? 'justify-center' : 'gap-3'}`}>
            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
              <BarChart2 size={20} strokeWidth={2.5} />
            </div>
            {!effectivelyCollapsed && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="overflow-hidden whitespace-nowrap mt-0.5">
                <h1 className="text-base font-bold text-primary dark:text-primary-light leading-tight">Karmayogi StatIQ</h1>
                <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mt-0.5">Institutional</p>
              </motion.div>
            )}
          </div>
          <button 
            className="hidden md:flex p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors shrink-0" 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            title={effectivelyCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            <Menu size={20} />
          </button>
          <button className="md:hidden p-2 text-slate-400 hover:bg-slate-100 rounded-full shrink-0" onClick={() => setMobileMenuOpen(false)}>
            <X size={20} />
          </button>
        </div>

        {/* Main Tabs */}
        <ul className="flex flex-col gap-2 flex-1">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <li key={item.id}>
                <button
                  onClick={() => {
                    setCurrentView(item.id);
                    setMobileMenuOpen(false);
                  }}
                  title={effectivelyCollapsed ? item.label : undefined}
                  className={`
                    flex items-center p-3 rounded-full font-medium text-sm transition-all w-full
                    ${isActive 
                      ? 'bg-secondary/10 text-secondary font-bold' 
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }
                    ${effectivelyCollapsed ? 'justify-center px-3' : 'gap-4 text-left px-5'}
                  `}
                >
                  <Icon size={20} className={`shrink-0 ${isActive ? 'text-secondary' : 'text-slate-400'}`} />
                  {!effectivelyCollapsed && <span className="whitespace-nowrap">{item.label}</span>}
                </button>
              </li>
            );
          })}
        </ul>

        {/* Footer Tabs */}
        <ul className="flex flex-col gap-2 mt-auto border-t border-border-color pt-4">
          <li>
            <button onClick={() => setIsClaimsPanelOpen(true)} title={effectivelyCollapsed ? "Auth Claims" : undefined} className={`flex items-center p-3 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all font-medium text-sm w-full ${effectivelyCollapsed ? 'justify-center px-3' : 'gap-4 text-left px-5'}`}>
              <Key size={20} className="text-slate-400 shrink-0" />
              {!effectivelyCollapsed && <span className="whitespace-nowrap">Auth Claims</span>}
            </button>
          </li>
          <li>
            <button onClick={() => showToast('Settings module coming soon')} title={effectivelyCollapsed ? "Settings" : undefined} className={`flex items-center p-3 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all font-medium text-sm w-full ${effectivelyCollapsed ? 'justify-center px-3' : 'gap-4 text-left px-5'}`}>
              <Settings size={20} className="text-slate-400 shrink-0" />
              {!effectivelyCollapsed && <span className="whitespace-nowrap">Settings</span>}
            </button>
          </li>
          <li>
            <button onClick={() => showToast('Support center is currently offline')} title={effectivelyCollapsed ? "Help" : undefined} className={`flex items-center p-3 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all font-medium text-sm w-full ${effectivelyCollapsed ? 'justify-center px-3' : 'gap-4 text-left px-5'}`}>
              <HelpCircle size={20} className="text-slate-400 shrink-0" />
              {!effectivelyCollapsed && <span className="whitespace-nowrap">Help</span>}
            </button>
          </li>
          <li>
            <button onClick={handleLogout} title={effectivelyCollapsed ? "Log Out" : undefined} className={`flex items-center p-3 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-all font-medium text-sm w-full mt-2 ${effectivelyCollapsed ? 'justify-center px-3' : 'gap-4 text-left px-5'}`}>
              <LogOut size={20} className="shrink-0" />
              {!effectivelyCollapsed && <span className="whitespace-nowrap">{user ? 'Log Out' : 'Exit Platform'}</span>}
            </button>
          </li>
        </ul>
      </nav>

      {/* Main Content Canvas */}
      <main className="flex-1 mt-16 md:mt-0 flex flex-col min-h-screen min-w-0 bg-background relative z-0">
        
        {/* TopNavBar (Desktop) */}
        <header className="hidden md:flex bg-surface dark:bg-slate-900 border-b border-border-color sticky top-0 w-full z-30 justify-between items-center px-8 h-16">
          <div className="font-semibold text-lg text-primary flex items-center gap-4">
            {/* Can put a breadcrumb or title here if needed */}
          </div>
          <div className="flex items-center gap-4 text-slate-600 dark:text-slate-300">
            <div className="relative items-center mr-4 hidden lg:flex">
              <Search size={18} className="absolute left-3 text-slate-400" />
              <input type="text" placeholder="Search resources..." className="pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-border-color rounded-full text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary w-64 transition-all" />
            </div>
            <PWAInstallButton variant="icon" />
            <button onClick={() => showToast('Refreshing...')} aria-label="sync" className="hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors p-2 rounded-full cursor-pointer">
              <RefreshCw size={20} />
            </button>
            <button onClick={() => showToast('No new notifications')} aria-label="notifications" className="hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors p-2 rounded-full cursor-pointer relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
            </button>
            <button onClick={toggleTheme} aria-label="Toggle theme" className="hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors p-2 rounded-full cursor-pointer">
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button onClick={() => showToast('Profile settings coming soon')} aria-label="account_circle" className="hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors p-2 rounded-full cursor-pointer text-primary">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="Profile" className="w-6 h-6 rounded-full object-cover" />
              ) : (
                <UserIcon size={20} />
              )}
            </button>
          </div>
        </header>

        {/* Scrollable Main Area with Page Transitions */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden relative flex flex-col">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="flex-1 flex flex-col"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Global Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 20, x: '-50%' }}
            className="fixed bottom-6 left-1/2 z-50 bg-slate-900 text-white px-6 py-3 rounded-full shadow-2xl font-medium text-sm flex items-center gap-3"
          >
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Claims Panel (Slide-over) */}
      <AnimatePresence>
        {isClaimsPanelOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50" 
              onClick={() => setIsClaimsPanelOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 w-full max-w-sm bg-surface border-l border-border-color shadow-2xl z-50 flex flex-col"
            >
              <div className="flex items-center justify-between p-6 border-b border-border-color">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                    <ShieldAlert size={20} />
                  </div>
                  <div>
                    <h2 className="font-bold text-lg text-slate-900">Auth Claims</h2>
                    <p className="text-xs text-slate-500 font-medium">Identity & Access Management</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsClaimsPanelOpen(false)}
                  className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 flex-1 overflow-y-auto">
                <div className="space-y-6">
                  {/* User Profile Info */}
                  <div className="bg-background border border-border-color p-4 rounded-[20px] shadow-sm">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Current Session</h3>
                    <div className="flex flex-col gap-3">
                      <div>
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Email</span>
                        <span className="text-sm font-medium text-slate-900">{user?.email || 'Not authenticated'}</span>
                      </div>
                      <div>
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Assigned Role</span>
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 border border-green-200 text-green-700 rounded-full text-xs font-bold capitalize">
                          {role || 'None'}
                        </div>
                      </div>
                      <div>
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-1">User ID (UID)</span>
                        <span className="text-xs font-mono text-slate-600 bg-slate-100 px-2 py-1 rounded">{user?.uid || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  {/* JWT/Firebase Claims */}
                  <div className="bg-background border border-border-color p-4 rounded-[20px] shadow-sm">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Token Payload (Mock)</h3>
                    <pre className="text-xs font-mono bg-slate-900 text-green-400 p-4 rounded-xl overflow-x-auto shadow-inner">
{JSON.stringify({
  "iss": "https://securetoken.google.com/...",
  "aud": "project-id",
  "auth_time": 1725215000,
  "user_id": user?.uid || "mock-uid",
  "sub": user?.uid || "mock-uid",
  "iat": 1725215000,
  "exp": 1725218600,
  "email": user?.email || "mock@example.com",
  "email_verified": true,
  "role": role || "user"
}, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
              <div className="p-6 border-t border-border-color bg-background/50">
                 <button 
                   onClick={() => setIsClaimsPanelOpen(false)}
                   className="w-full bg-primary text-white font-bold text-sm py-3 rounded-full hover:bg-primary-light transition-colors shadow-md active:scale-95"
                 >
                   Acknowledge
                 </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      <OfflineIndicator />
    </div>
  );
}

