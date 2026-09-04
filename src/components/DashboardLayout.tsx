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
  Key,
  Award,
  PlayCircle,
  Database,
  Accessibility
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../lib/AuthContext';
import { useTheme } from '../lib/ThemeContext';
import { useAccessibility } from '../lib/AccessibilityContext';
import { PWAInstallButton } from './PWAInstallButton';
import { useOnlineStatus } from '../lib/usePWAInstall';

import { Outlet, useNavigate, useLocation } from 'react-router-dom';

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

export function DashboardLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isClaimsPanelOpen, setIsClaimsPanelOpen] = useState(false);
  const [isA11yPanelOpen, setIsA11yPanelOpen] = useState(false);
  const { user, role, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const accessibility = useAccessibility();
  const navigate = useNavigate();
  const location = useLocation();

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };


  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const navItems = [
    { path: '/learner', label: 'Competency Profile', icon: LayoutDashboard, category: 'Learner Hub', roles: ['admin', 'learner'] },
    { path: '/learner/assessments', label: 'Assigned Assessments', icon: CheckSquare, category: 'Learner Hub', roles: ['admin', 'learner'] },
    { path: '/learner/workshops', label: 'TPAC Workshop Roster', icon: Award, category: 'Learner Hub', roles: ['admin', 'learner'] },
    { path: '/authoring/generator', label: 'AI Quiz Generator', icon: FileText, category: 'Authoring', roles: ['admin'] },
    { path: '/admin', label: 'Analytics Console', category: 'Admin Cadre', icon: BarChart2, roles: ['admin'] },
    { path: '/admin/library', label: 'Assessment Library', category: 'Admin Cadre', icon: Database, roles: ['admin'] },
  ];

  const visibleNavItems = navItems.filter(item => !role || item.roles.includes(role));

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50 antialiased font-sans">
      {/* TopNavBar (Mobile Only) */}
      <header className="md:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 fixed top-0 w-full z-50 flex justify-between items-center px-4 h-16 shadow-sm">
        <div className="flex items-center gap-1">
          <button onClick={() => setMobileMenuOpen(true)} className="p-3 -ml-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors active:scale-95">
            <Menu size={24} />
          </button>
          <span className="font-semibold text-xl text-blue-900 dark:text-blue-100 font-bold ml-1 tracking-tight">StatIQ</span>
        </div>
        <div className="flex items-center text-slate-600 dark:text-slate-300 gap-1">
          <button onClick={() => setIsA11yPanelOpen(true)} aria-label="accessibility" className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors active:scale-95">
            <Accessibility size={22} />
          </button>
          <button onClick={() => showToast('No new notifications')} aria-label="notifications" className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors relative active:scale-95">
            <Bell size={22} />
            <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
          </button>
          <button onClick={() => {
            navigate('/learner/profile');
            setMobileMenuOpen(false);
          }} aria-label="profile" className="hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors p-2 rounded-full text-blue-900 dark:text-blue-200 ml-1 active:scale-95">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="Profile" className="w-8 h-8 rounded-full object-cover shadow-sm" />
            ) : (
              <UserIcon size={22} className="m-1" />
            )}
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
        fixed inset-y-0 left-0 z-50 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col p-4 transform transition-all duration-300 shadow-2xl md:shadow-none
        ${mobileMenuOpen ? 'translate-x-0 w-[280px]' : '-translate-x-full md:translate-x-0'}
        md:w-[280px]
      `}>
        {/* Header */}
        <div className="flex mb-8 mt-2 items-center justify-between px-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/40 text-blue-900 dark:text-blue-100 flex items-center justify-center shrink-0">
              <BarChart2 size={20} strokeWidth={2.5} />
            </div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="overflow-hidden whitespace-nowrap mt-0.5">
              <h1 className="text-base font-bold text-blue-900 dark:text-blue-100 leading-tight">StatIQ</h1>
              <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mt-0.5">Institutional</p>
            </motion.div>
          </div>
          <button className="md:hidden p-2 text-slate-400 hover:bg-slate-100 rounded-md shrink-0" onClick={() => setMobileMenuOpen(false)}>
            <X size={20} />
          </button>
        </div>

        {/* Side Menu Navigation */}
        <div className="flex-1 overflow-y-auto space-y-6 pr-1">
          {['Learner Hub', 'Authoring', 'Admin Cadre'].map(cat => {
            const catItems = visibleNavItems.filter(item => item.category === cat);
            if (catItems.length === 0) return null;
            return (
              <div key={cat} className="space-y-1">
                <p className="px-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">{cat}</p>
                <ul className="space-y-1">
                  {catItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    return (
                      <li key={item.path}>
                        <button
                          onClick={() => {
                            navigate(item.path);
                            setMobileMenuOpen(false);
                          }}
                          className={`
                            flex items-center py-3 px-4 rounded-xl font-medium text-sm transition-all w-full gap-3 text-left cursor-pointer border border-transparent
                            ${isActive 
                              ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100 border-blue-100 dark:border-blue-900/50 font-bold shadow-sm' 
                              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                            }
                          `}
                        >
                          <Icon size={20} className={`shrink-0 ${isActive ? 'text-blue-900 dark:text-blue-200' : 'text-slate-400'}`} />
                          <span className="whitespace-nowrap">{item.label}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}

        </div>

        {/* Footer Tabs */}
        <ul className="flex flex-col gap-1.5 mt-auto border-t border-slate-200 dark:border-slate-800 pt-6 pb-6">
          <li>
            <button 
              onClick={() => {
                navigate('/learner/profile');
                setMobileMenuOpen(false);
              }} 
              className={`flex items-center py-3.5 px-4 rounded-xl transition-all font-bold text-sm w-full gap-4 text-left ${location.pathname === '/learner/profile' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100 border border-blue-100 dark:border-blue-900/50 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 border border-transparent'}`}
            >
              {user?.photoURL ? (
                <img src={user.photoURL} alt="Profile" className="w-8 h-8 rounded-full object-cover shrink-0 shadow-sm" />
              ) : (
                <UserIcon size={24} className="shrink-0 text-slate-400" />
              )}
              <span className="whitespace-nowrap flex-1 truncate text-slate-700 dark:text-slate-200">{user?.displayName || user?.email || 'User Profile'}</span>
            </button>
          </li>
        </ul>
      </nav>

      {/* Main Content Canvas */}
      <main className="flex-1 mt-16 md:mt-0 flex flex-col min-h-screen min-w-0 bg-slate-50 dark:bg-slate-900 relative z-0 md:ml-[280px]">
        
        {/* TopNavBar (Desktop) */}
        <header className="hidden md:flex flex-col sticky top-0 w-full z-30 bg-white/95 dark:bg-slate-900/95 border-b border-slate-200 dark:border-slate-800 transition-all">
          <div className="flex justify-between items-center px-10 h-16 w-full">
            <div className="font-semibold text-lg text-primary flex items-center gap-4">
              {/* Can put a breadcrumb or title here if needed */}
            </div>
            <div className="flex items-center gap-4 text-slate-600 dark:text-slate-300">
              <div className="relative items-center mr-4 hidden lg:flex">
                <Search size={18} className="absolute left-3 text-slate-400" />
                <input type="text" placeholder="Search resources..." className="pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-sm focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900 w-64 transition-all" />
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
              <button onClick={() => showToast('Profile settings coming soon')} aria-label="account_circle" className="hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors p-2 rounded-full cursor-pointer text-blue-900 dark:text-blue-200">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="Profile" className="w-6 h-6 rounded-full object-cover" />
                ) : (
                  <UserIcon size={20} />
                )}
              </button>
            </div>
          </div>
        </header>

        {/* Scrollable Main Area with Page Transitions */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden relative flex flex-col">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-900"
            >
              <Outlet />
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
            <div className="w-2 h-2 rounded-full bg-blue-900 animate-pulse" />
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
              className="fixed inset-y-0 right-0 w-full max-w-sm bg-white dark:bg-[#1C1B1F] border-l border-slate-200 dark:border-slate-800 shadow-2xl z-50 flex flex-col"
            >
              <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/40 text-blue-900 dark:text-blue-100 flex items-center justify-center">
                    <ShieldAlert size={20} />
                  </div>
                  <div>
                    <h2 className="font-bold text-lg text-slate-900 dark:text-slate-100 tracking-tight">Auth Claims</h2>
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
                  <div className="bg-[#FDF7FF] dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Current Session</h3>
                    <div className="flex flex-col gap-3">
                      <div>
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Email</span>
                        <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{user?.email || 'Not authenticated'}</span>
                      </div>
                      <div>
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Assigned Role</span>
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 dark:bg-green-950/30 border border-green-200/50 text-green-700 dark:text-green-400 rounded-full text-xs font-bold capitalize">
                          {role || 'None'}
                        </div>
                      </div>
                      <div>
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-1">User ID (UID)</span>
                        <span className="text-xs font-mono text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">{user?.uid || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  {/* JWT/Firebase Claims */}
                  <div className="bg-[#FDF7FF] dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm">
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
              <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40">
                 <button 
                   onClick={() => setIsClaimsPanelOpen(false)}
                   className="w-full bg-blue-900 text-white font-bold text-sm py-3 rounded-full hover:bg-blue-800 transition-colors shadow-md active:scale-95"
                 >
                   Acknowledge
                 </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Accessibility Panel (Slide-over) */}
      <AnimatePresence>
        {isA11yPanelOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50" 
              onClick={() => setIsA11yPanelOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 w-full max-w-sm bg-white dark:bg-[#1C1B1F] border-l border-slate-200 dark:border-slate-800 shadow-2xl z-50 flex flex-col"
            >
              <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/40 text-blue-900 dark:text-blue-100 flex items-center justify-center">
                    <Accessibility size={20} />
                  </div>
                  <div>
                    <h2 className="font-bold text-lg text-slate-900 dark:text-slate-100 tracking-tight">Accessibility</h2>
                    <p className="text-xs text-slate-500 font-medium">Personalize your experience</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsA11yPanelOpen(false)}
                  className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 flex-1 overflow-y-auto space-y-8">
                
                {/* Text Size */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Text Size</h3>
                  <div className="flex flex-col gap-3">
                    {(['normal', 'large', 'xlarge'] as const).map(size => (
                      <button
                        key={size}
                        onClick={() => accessibility.setTextSize(size)}
                        className={`flex items-center justify-between p-4 rounded-xl border transition-all ${accessibility.textSize === size ? 'border-blue-900 bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-100' : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                      >
                        <span className="font-bold capitalize">{size}</span>
                        {accessibility.textSize === size && <div className="w-3 h-3 rounded-full bg-blue-900" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Contrast Level */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Contrast Level</h3>
                  <div className="flex flex-col gap-3">
                    {(['normal', 'high'] as const).map(level => (
                      <button
                        key={level}
                        onClick={() => accessibility.setContrast(level)}
                        className={`flex items-center justify-between p-4 rounded-xl border transition-all ${accessibility.contrast === level ? 'border-blue-900 bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-100' : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                      >
                        <span className="font-bold capitalize">{level}</span>
                        {accessibility.contrast === level && <div className="w-3 h-3 rounded-full bg-blue-900" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Reduced Motion */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Animations</h3>
                  <label className={`flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer ${accessibility.reducedMotion ? 'border-blue-900 bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-100' : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'}`}>
                    <span className="font-bold">Reduce Motion</span>
                    <input 
                      type="checkbox" 
                      checked={accessibility.reducedMotion}
                      onChange={(e) => accessibility.setReducedMotion(e.target.checked)}
                      className="w-4 h-4 accent-blue-900"
                    />
                  </label>
                </div>

              </div>
              <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40">
                 <button 
                   onClick={() => setIsA11yPanelOpen(false)}
                   className="w-full bg-blue-900 text-white font-bold text-sm py-3 rounded-full hover:bg-blue-800 transition-colors shadow-md active:scale-95"
                 >
                   Done
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

