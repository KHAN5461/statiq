import React, { useState, useEffect } from 'react';
import { ViewState } from '../types';
import { 
  ArrowRight, 
  BarChart2, 
  BookOpen, 
  Target, 
  ShieldCheck, 
  Cpu, 
  Activity, 
  TrendingUp,
  Award,
  ChevronRight,
  Database,
  Lock,
  Globe,
  LogIn,
  Moon,
  Sun
} from 'lucide-react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { useTheme } from '../lib/ThemeContext';
import { PWAInstallButton } from './PWAInstallButton';
import { AdminLoginModal } from './AdminLoginModal';
import Material3Showcase, { M3CompetencyRadar, M3ZonalReadinessChart } from './Material3Showcase';

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

export function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const { user, role, signInWithGoogle, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleAuthAction = async (forcedRole?: 'admin' | 'learner') => {
    if (user) {
      if (role === 'admin' || forcedRole === 'admin') navigate('/admin');
      else navigate('/learner');
    } else {
      try {
        await signInWithGoogle(forcedRole);
        if (forcedRole === 'admin') navigate('/admin');
        else navigate('/learner');
      } catch (err: any) {
        if (err?.code === 'auth/popup-closed-by-user' || err?.message?.includes('popup-closed-by-user')) {
          console.log('Google Auth sign-in cancelled by user (popup closed).');
        } else {
          console.error('Authentication failure:', err);
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-background text-slate-800 flex flex-col font-sans overflow-x-hidden">
      {/* Navigation */}

      <header className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white/90 backdrop-blur-md shadow-sm py-3' : 'bg-transparent py-5'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className={`font-extrabold text-2xl tracking-tight transition-colors ${scrolled ? 'text-blue-900' : 'text-blue-950'}`}>
              Karmayogi StatIQ
            </span>
            <span className="hidden md:inline-flex ml-2 px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-900 text-xs font-bold tracking-widest uppercase">Beta</span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-6 text-sm font-medium">
              <a href="#features" className="text-slate-600 hover:text-blue-900 transition-colors">Features</a>
              <a href="#impact" className="text-slate-600 hover:text-blue-900 transition-colors">Impact</a>
            </div>
            
            <button onClick={toggleTheme} aria-label="Toggle theme" className="hover:bg-slate-200 transition-colors p-2 rounded-full cursor-pointer text-slate-500 hidden md:block">
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <PWAInstallButton />
            {user ? (
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setIsAdminModalOpen(true)}
                  className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-md font-semibold text-xs md:text-sm transition-all shadow-sm flex items-center gap-2 active:scale-95 border border-slate-200/50 dark:border-slate-700/50"
                >
                  <ShieldCheck size={14} className="text-amber-500" />
                  Login as Admin
                </button>
                <button 
                  onClick={() => handleAuthAction('learner')}
                  className="bg-blue-900 hover:bg-blue-800 text-white px-5 py-2.5 rounded-md font-semibold text-sm transition-all shadow-md hover:shadow-lg flex items-center gap-2 active:scale-95"
                >
                  Go to Dashboard <ArrowRight size={16} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setIsAdminModalOpen(true)}
                  className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-md font-semibold text-xs md:text-sm transition-all shadow-sm flex items-center gap-2 active:scale-95 border border-slate-200/50 dark:border-slate-700/50"
                >
                  <ShieldCheck size={14} className="text-amber-500" />
                  Login as Admin
                </button>
                <button 
                  onClick={() => handleAuthAction('learner')}
                  className="bg-blue-900 hover:bg-blue-800 text-white px-5 py-2.5 rounded-md font-semibold text-sm transition-all shadow-md hover:shadow-lg flex items-center gap-2 active:scale-95"
                >
                  Sign In / Register <LogIn size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Admin Login Portal Overlay Modal */}
      <AdminLoginModal 
        isOpen={isAdminModalOpen} 
        onClose={() => setIsAdminModalOpen(false)} 
        setCurrentView={setCurrentView} 
      />

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        
        <motion.div initial="hidden" animate="visible" variants={fadeIn} className="flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-md bg-white text-slate-700 font-semibold text-sm mb-8 border border-slate-200 shadow-sm">
            <ShieldCheck size={16} className="text-blue-900" />
            MoSPI Problem Statement ID 26101
          </div>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-slate-900 tracking-tight max-w-4xl mx-auto mb-6 leading-[1.1]">
            Skill Intelligence for the <span className="text-blue-900">Statistical Cadre</span>
          </h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto mb-10 leading-relaxed">
            Convert statutory manuals into verifiable FRAC competencies. Deliver automated, precise skill-gap mapping directly aligned with the iGOT Karmayogi framework.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
            {user ? (
              <button 
                onClick={() => handleAuthAction('learner')}
                className="w-full sm:w-auto bg-primary hover:bg-primary-light text-white px-8 py-4 rounded-full font-bold text-lg transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
              >
                Access Dashboard <ArrowRight size={20} />
              </button>
            ) : (
              <button 
                onClick={() => handleAuthAction('learner')}
                className="w-full sm:w-auto bg-primary hover:bg-primary-light text-white px-8 py-4 rounded-full font-bold text-lg transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
              >
                Sign In with Google <LogIn size={20} />
              </button>
            )}
          </div>
        </motion.div>
      </section>

      {/* Social Proof */}
      <section id="mospi" className="py-12 border-y border-border-color bg-surface/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm font-bold text-slate-400 mb-8">Trusted by key national institutions</p>
          <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-8 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
            <div className="flex items-center gap-3 font-bold text-2xl text-slate-800"><Award size={28} className="text-primary" /> MoSPI</div>
            <div className="flex items-center gap-3 font-bold text-2xl text-slate-800"><ShieldCheck size={28} className="text-accent" /> NSSTA</div>
            <div className="flex items-center gap-3 font-bold text-2xl text-slate-800"><Target size={28} className="text-green-600" /> iGOT Karmayogi</div>
            <div className="flex items-center gap-3 font-bold text-2xl text-slate-800"><Globe size={28} className="text-blue-500" /> Digital India</div>
          </div>
        </div>
      </section>

      {/* Core Offerings Bento Grid */}
      <section id="competency" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="mb-16 md:text-center">
          <h2 className="text-4xl font-extrabold text-slate-900 mb-6 tracking-tight">Enterprise Intelligence Suite</h2>
          <p className="text-xl text-slate-600 max-w-2xl md:mx-auto">A comprehensive platform bridging the gap between field operations and strategic capacity building.</p>
        </div>
        
        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {/* Module 1 */}
          <motion.div variants={fadeIn} className="lg:col-span-2 bg-surface rounded-[20px] p-8 md:p-10 border border-border-color transition-all hover:bg-background/80 group">
            <div className="w-14 h-14 rounded-full bg-background border border-border-color flex items-center justify-center text-primary mb-8 shadow-sm">
              <Cpu size={28} />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-4">Document to Dynamic Assessment</h3>
            <p className="text-slate-600 text-lg leading-relaxed mb-8 max-w-xl">Instant JSON conversion for PDFs and circulars with Bloom's taxonomy tagging. Upload complex manuals and extract structurally sound, cadre-specific evaluations.</p>
            <div className="bg-background border border-border-color rounded-[20px] p-6 font-mono text-sm text-slate-600 overflow-hidden shadow-sm">
              <div className="flex justify-between items-center mb-4 pb-4 border-b border-border-color">
                <span className="font-semibold text-slate-400 text-xs">JSON output</span>
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
              </div>
              <pre className="text-slate-700">
{`{
  "question": "Which stratification method is optimal for...",
  "options": ["A", "B", "C", "D"],
  "taxonomy": "Application",
  "competency": "Sampling Design"
}`}
              </pre>
            </div>
          </motion.div>

          {/* Module 2: Learner Competency Radar */}
          <motion.div id="generator" variants={fadeIn} className="lg:col-span-2 bg-surface rounded-[20px] p-6 border border-border-color transition-all hover:bg-background/80 flex flex-col justify-between">
            <div className="mb-4">
              <h3 className="text-xl font-bold text-slate-900 mb-2">Skill-Gap Delta & Competency Radar</h3>
              <p className="text-slate-600 text-sm leading-relaxed">Continuous 8-axis FRAC evaluation comparing officer scores against target benchmarks.</p>
            </div>
            <div className="h-[280px] w-full">
              <M3CompetencyRadar />
            </div>
          </motion.div>

          {/* Module 3: iGOT Bridge */}
          <motion.div id="igot" variants={fadeIn} className="bg-surface rounded-[20px] p-8 md:p-10 border border-border-color transition-all hover:bg-background/80 group flex flex-col">
            <div className="w-14 h-14 rounded-full bg-background border border-border-color flex items-center justify-center text-primary mb-8 shadow-sm">
              <BookOpen size={28} />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-4">iGOT Bridge</h3>
            <p className="text-slate-600 text-lg leading-relaxed mb-8 flex-grow">Automated course routing bridging real-time deficiencies with official training modules directly through the iGOT framework.</p>
            <button onClick={() => setCurrentView('learner')} className="text-primary font-bold flex items-center gap-2 hover:gap-3 transition-all self-start cursor-pointer">
              Explore Pathways <ArrowRight size={18} />
            </button>
          </motion.div>

          {/* Module 4: Admin Cadre Readiness Graph */}
          <motion.div variants={fadeIn} className="lg:col-span-3 bg-surface rounded-[20px] p-6 border border-border-color transition-all hover:bg-background/80 flex flex-col justify-between">
            <div className="mb-4">
              <h3 className="text-xl font-bold text-slate-900 mb-2">Cadre Controller Zonal Readiness Analytics</h3>
              <p className="text-slate-600 text-sm leading-relaxed">Zonal NSSO readiness metrics across all 6 Indian Statistical Service regional divisions.</p>
            </div>
            <div className="h-[280px] w-full">
              <M3ZonalReadinessChart onTriggerWorkshop={() => setCurrentView('admin')} />
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Material 3 Core Interactive Component Showcase */}
      <Material3Showcase />

      {/* System Architecture & Execution Plan */}
      <section id="architecture" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-border-color">
        <div className="mb-16 md:text-center">
          <h2 className="text-4xl font-extrabold text-slate-900 mb-6 tracking-tight">System Architecture</h2>
          <p className="text-xl text-slate-600 max-w-2xl md:mx-auto">End-to-End Workflow mapping the technical solution to MoSPI's core requirements.</p>
        </div>

        {/* ASCII Architecture Diagram */}
        <motion.div 
          initial="hidden"
          whileInView="visible"
          variants={fadeIn}
          viewport={{ once: true, margin: "-100px" }}
          className="bg-slate-900 text-slate-300 rounded-[20px] p-6 md:p-10 mb-20 overflow-x-auto shadow-2xl relative"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-secondary"></div>
          <pre className="font-mono text-[10px] sm:text-xs md:text-sm leading-tight md:leading-snug whitespace-pre">
{` ┌────────────────────────────────────────────────────────────────────────────────────────┐
 │                              1. INGESTION & PARSING LAYER                              │
 │  Admin/Trainer uploads PDF/Text (NSSO Manuals, MoSPI Guidelines, SNA Reports)          │
 │                                           │                                            │
 │                                           ▼                                            │
 │                  FastAPI + Pydantic Strict JSON Schema Engine                          │
 │                                           │                                            │
 │                                           ▼                                            │
 │                     Structured Assessment JSON Output:                                 │
 │     • Questions • 4 Options • Answer Key • Bloom's Level • Official Explanation        │
 └───────────────────────────────────────────┬────────────────────────────────────────────┘
                                             │
                                             ▼
 ┌────────────────────────────────────────────────────────────────────────────────────────┐
 │                            2. INTERACTIVE ASSESSMENT RUNNER                            │
 │  Dynamic Client-Side UI:                                                               │
 │     • Multi-cadre Test Queue (Assigned / Speed / Comprehensive)                        │
 │     • Real-time Test Runner (Timers, Keyboard shortcuts A-D, Single-select)            │
 │     • Post-Test Diagnostic & Rationale Drawer                                          │
 └───────────────────────────────────────────┬────────────────────────────────────────────┘
                                             │
                                             ▼
 ┌────────────────────────────────────────────────────────────────────────────────────────┐
 │                      3. FRAC COMPETENCY & RECOMMENDATION ENGINE                        │
 │  • Evaluates score against baseline role requirements (JSO, SSO, ISS Cadres)           │
 │  • Computes Skill Gap Delta: Max(0, Baseline_Benchmark - Evaluated_Score)              │
 │  • Triggers Recommender: Matches deficits to iGOT Karmayogi & NSSTA TPAC modules       │
 └───────────────────────────────────────────┬────────────────────────────────────────────┘
                                             │
                                             ▼
 ┌────────────────────────────────────────────────────────────────────────────────────────┐
 │                       4. CADRE CONTROLLER & ZONAL ANALYTICS                            │
 │  • Zonal Competency Heatmap (NSSO Field Operations Divisions across 6 zones)           │
 │  • Batch Training Needs Assessment (TNA) for NSSTA Greater Noida Campus                │
 └────────────────────────────────────────────────────────────────────────────────────────┘`}
          </pre>
        </motion.div>

        {/* 4-Stage Execution Plan */}
        <div className="mb-12 md:text-center mt-24">
          <h2 className="text-3xl font-extrabold text-slate-900 mb-6 tracking-tight">4-Stage Build & Integration Plan</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-24">
          {[
            { phase: 'STAGE 1', title: 'AI Studio Prompting & Schema Validation', time: 'Hours 1 - 3', desc: 'Test the model in Google AI Studio by feeding real snippets from public MoSPI reports (NSS 78th round). Ensure zero formatting hallucinations.' },
            { phase: 'STAGE 2', title: 'Export & Setup SDK (FastAPI / Next.js)', time: 'Hours 4 - 7', desc: 'Click "Get Code" in AI Studio. Set up lightweight FastAPI endpoint and define Pydantic schema models.' },
            { phase: 'STAGE 3', title: 'State Engine & UI (Interactive Runner)', time: 'Hours 8 - 14', desc: 'Read returned JSON. Render question cards, option radio tiles, countdown timers, and post-test Bloom\'s diagnostic drawer.' },
            { phase: 'STAGE 4', title: 'iGOT Recommender Loop & Telemetry Sync', time: 'Hours 15 - 20', desc: 'Wire evaluation to FRAC Competency Engine. Query mock iGOT / NSSTA catalog to surface matching remedial modules.' }
          ].map((item, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.15 }}
              viewport={{ once: true }}
              className="bg-surface border border-border-color rounded-[20px] p-6 relative group hover:bg-background transition-colors shadow-sm"
            >
              <div className="text-[10px] font-extrabold text-primary uppercase tracking-widest mb-2 flex justify-between items-center">
                <span>{item.phase}</span>
                <span className="bg-background border border-border-color px-2 py-1 rounded-full text-slate-500 shadow-sm">{item.time}</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-3">{item.title}</h3>
              <p className="text-sm text-slate-600 font-medium leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Hackathon Deliverable Checklist */}
        <div className="mb-12 md:text-center">
          <h2 className="text-3xl font-extrabold text-slate-900 mb-6 tracking-tight">Hackathon Deliverable Checklist</h2>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-surface rounded-[20px] border border-border-color overflow-hidden shadow-sm"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-background border-b border-border-color">
                  <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-widest">Component</th>
                  <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-widest">Technology</th>
                  <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-widest">Role in Hackathon Pitch</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-color">
                <tr className="hover:bg-background transition-colors">
                  <td className="py-5 px-6 font-bold text-slate-900">Gen-AI Engine</td>
                  <td className="py-5 px-6 font-medium text-slate-600">Google AI Studio + Gemini 1.5 Flash</td>
                  <td className="py-5 px-6 font-medium text-slate-600">Real-time text/PDF-to-JSON generation in {'<'} 3 seconds</td>
                </tr>
                <tr className="hover:bg-background transition-colors">
                  <td className="py-5 px-6 font-bold text-slate-900">Assessment Runner</td>
                  <td className="py-5 px-6 font-medium text-slate-600">Next.js 14, Tailwind CSS, React</td>
                  <td className="py-5 px-6 font-medium text-slate-600">Dynamic quiz execution with timers, instant grading & rationales</td>
                </tr>
                <tr className="hover:bg-background transition-colors">
                  <td className="py-5 px-6 font-bold text-slate-900">FRAC Competency Spider</td>
                  <td className="py-5 px-6 font-medium text-slate-600">Chart.js / Recharts</td>
                  <td className="py-5 px-6 font-medium text-slate-600">Visualizes live proficiency drops and gains against baseline gaps</td>
                </tr>
                <tr className="hover:bg-background transition-colors">
                  <td className="py-5 px-6 font-bold text-slate-900">iGOT / NSSTA Integration</td>
                  <td className="py-5 px-6 font-medium text-slate-600">REST APIs / Mock Webhooks</td>
                  <td className="py-5 px-6 font-medium text-slate-600">Automated course recommendations bridging the exact skill gap</td>
                </tr>
                <tr className="hover:bg-background transition-colors">
                  <td className="py-5 px-6 font-bold text-slate-900">Admin Cadre View</td>
                  <td className="py-5 px-6 font-medium text-slate-600">Tailwind UI Tables</td>
                  <td className="py-5 px-6 font-medium text-slate-600">Demonstrates ministerial-level workforce analytics across NSSO zones</td>
                </tr>
              </tbody>
            </table>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-16 px-4 sm:px-6 lg:px-8 border-t border-slate-800 mt-auto">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white shadow-lg">
                <BarChart2 size={20} strokeWidth={2.5} />
              </div>
              <span className="font-bold text-white text-xl tracking-tight">Karmayogi StatIQ</span>
            </div>
            <p className="text-sm leading-relaxed mb-6">AI-enabled Skill Intelligence for India's Official Statistical System.</p>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 bg-slate-800 w-fit px-3 py-1.5 rounded-lg border border-slate-700">
              <Lock size={12} /> SECURE PLATFORM
            </div>
          </div>
          <div>
            <h4 className="text-white font-bold mb-6 tracking-wide uppercase text-sm">Architecture</h4>
            <ul className="space-y-3 text-sm font-medium">
              <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
              <li><a href="#" className="hover:text-white transition-colors">FRAC Taxonomy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">API Reference</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-6 tracking-wide uppercase text-sm">Resources</h4>
            <ul className="space-y-3 text-sm font-medium">
              <li><a href="#" className="hover:text-white transition-colors">NSSTA TPAC Schedule</a></li>
              <li><a href="#" className="hover:text-white transition-colors">iGOT Bridge Guides</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Compliance</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-6 tracking-wide uppercase text-sm">Legal</h4>
            <ul className="space-y-3 text-sm font-medium">
              <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-slate-800 text-sm flex flex-col md:flex-row justify-between items-center gap-4 font-medium">
          <p>© 2024 MoSPI | Digital India Initiative. All rights reserved.</p>
          <p>Government Compliance Disclaimer applies.</p>
        </div>
      </footer>
    </div>
  );
}

function SparklesIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
      <path d="M5 3v4"/>
      <path d="M19 17v4"/>
      <path d="M3 5h4"/>
      <path d="M17 19h4"/>
    </svg>
  )
}
