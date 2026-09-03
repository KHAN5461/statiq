import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts';
import { 
  Plus, Search, Filter, MoreVertical, BookOpen, BarChart2, Calendar, 
  Trash2, Send, SlidersHorizontal, Sparkles, TrendingUp, Users, Award, 
  ArrowUpRight, AlertCircle, CheckCircle2, FileText, ChevronRight,
  Settings, Home, Briefcase, Info, X, Clock, Bell, Shield, Layers, HelpCircle
} from 'lucide-react';

// --- M3 VECTOR ILLUSTRATION GRAPHIC (Document-to-AI Ingestion Visual) ---
export const M3AiIngestionIllustration: React.FC = () => (
  <svg viewBox="0 0 320 180" className="w-full h-auto max-w-[280px] mx-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="20" y="20" width="280" height="140" rx="16" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="2" />
    <rect x="40" y="40" width="100" height="100" rx="8" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1.5" className="shadow-sm" />
    <path d="M55 55H125M55 70H110M55 85H120M55 100H95" stroke="#94A3B8" strokeWidth="3" strokeLinecap="round" />
    <circle cx="210" cy="90" r="32" fill="#1A365D" />
    <path d="M210 74L213.5 83.5L223 87L213.5 90.5L210 100L206.5 90.5L197 87L206.5 83.5L210 74Z" fill="#D97706" />
    <circle cx="228" cy="72" r="3" fill="#38BDF8" />
    <circle cx="192" cy="106" r="4" fill="#38BDF8" />
    <path d="M140 90H170" stroke="#D97706" strokeWidth="2" strokeDasharray="4 4" />
  </svg>
);

// --- RECHARTS FRAC COMPETENCY SPIDER CHART (8-Axis M3 Custom Styled) ---
const fracRadarData = [
  { subject: 'Sampling', evaluated: 4.2, baseline: 5.0 },
  { subject: 'Accounts', evaluated: 4.8, baseline: 5.0 },
  { subject: 'Indices', evaluated: 3.5, baseline: 4.5 },
  { subject: 'Python/R', evaluated: 2.8, baseline: 4.0 },
  { subject: 'GIS Map', evaluated: 4.5, baseline: 4.5 },
  { subject: 'Governance', evaluated: 3.9, baseline: 4.0 },
  { subject: 'Quality', evaluated: 4.7, baseline: 5.0 },
  { subject: 'Field Ops', evaluated: 3.2, baseline: 4.0 },
];

export const M3CompetencyRadar: React.FC = () => (
  <div className="bg-white dark:bg-slate-900 p-6 rounded-[20px] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between h-full">
    <div className="flex items-center justify-between mb-4">
      <div>
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Award className="w-5 h-5 text-[#1A365D] dark:text-[#93C5FD]" /> 8-Axis FRAC Competency Radar
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">Performance vs. role benchmark baseline</p>
      </div>
      <span className="text-xs bg-amber-50 dark:bg-amber-950/30 text-[#D97706] font-bold px-2.5 py-1 rounded-full border border-amber-200/50">
        2 Skill Deficits Found
      </span>
    </div>

    <div className="h-[250px] w-full flex items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="75%" data={fracRadarData}>
          <PolarGrid stroke="#E2E8F0" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 10, fontWeight: 600 }} />
          <PolarRadiusAxis angle={30} domain={[0, 5]} stroke="#CBD5E1" />
          <Radar name="Target Baseline" dataKey="baseline" stroke="#94A3B8" fill="#94A3B8" fillOpacity={0.1} strokeDasharray="3 3" />
          <Radar name="Evaluated Score" dataKey="evaluated" stroke="#1A365D" fill="#1A365D" fillOpacity={0.25} />
        </RadarChart>
      </ResponsiveContainer>
    </div>

    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs text-slate-500">
      <div className="flex items-center gap-2">
        <span className="w-3 h-3 bg-[#1A365D] rounded-sm inline-block" /> Evaluated Score
      </div>
      <div className="flex items-center gap-2">
        <span className="w-3 h-3 bg-slate-300 rounded-sm inline-block" /> Target Baseline
      </div>
    </div>
  </div>
);

// --- RECHARTS REGIONAL WORKFORCE READINESS BAR CHART ---
const zonalReadinessData = [
  { zone: 'Northern', ready: 88, target: 100 },
  { zone: 'Western', ready: 62, target: 100 },
  { zone: 'Southern', ready: 94, target: 100 },
  { zone: 'Eastern', ready: 75, target: 100 },
  { zone: 'North-East', ready: 58, target: 100 },
  { zone: 'Central', ready: 81, target: 100 },
];

export const M3ZonalReadinessChart: React.FC<{ onTriggerWorkshop: () => void }> = ({ onTriggerWorkshop }) => (
  <div className="bg-white dark:bg-slate-900 p-6 rounded-[20px] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between h-full">
    <div className="flex items-center justify-between mb-4">
      <div>
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-[#D97706]" /> NSSO Field Operations Regional Readiness (%)
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">Field Enumerator readiness prior to survey launches</p>
      </div>
      <button className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
        Export CSV <ArrowUpRight className="w-3.5 h-3.5" />
      </button>
    </div>

    <div className="h-[250px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={zonalReadinessData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
          <XAxis dataKey="zone" tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 100]} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1E293B', borderRadius: '12px', border: 'none', color: '#FFF', fontSize: '11px' }}
          />
          <Bar dataKey="ready" fill="#1A365D" radius={[4, 4, 0, 0]} barSize={24} />
        </BarChart>
      </ResponsiveContainer>
    </div>

    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
      <span>Lowest Performing: <strong className="text-amber-600 dark:text-amber-400">North-East Zone (58%)</strong></span>
      <button 
        onClick={onTriggerWorkshop}
        className="px-3 py-1 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 text-[#D97706] rounded-full font-bold transition-colors"
      >
        Draft NSSTA Workshop Roster
      </button>
    </div>
  </div>
);

// --- M3 EXTENDED FAB COMPONENT ---
export const M3ExtendedFAB: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button
    onClick={onClick}
    className="inline-flex items-center gap-3 px-6 py-4 bg-[#1A365D] hover:bg-[#0F294A] text-white rounded-[16px] shadow-lg hover:shadow-xl transition-all active:scale-95 border border-white/10"
  >
    <Plus className="w-6 h-6 text-[#D97706]" />
    <span className="font-semibold text-sm tracking-wide">New Assessment</span>
  </button>
);

// --- M3 FILTER CHIP COMPONENT ---
export const M3FilterChip: React.FC<{ label: string; active?: boolean; onClick?: () => void }> = ({
  label,
  active = false,
  onClick
}) => (
  <button
    onClick={onClick}
    className={`inline-flex items-center px-4 py-1.5 rounded-[8px] text-xs font-medium transition-colors border ${
      active
        ? 'bg-[#1A365D] text-white border-[#1A365D]'
        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-200'
    }`}
  >
    {label}
  </button>
);

// --- M3 OUTLINED ASSESSMENT CARD COMPONENT ---
export interface AssessmentItem {
  id: string;
  title: string;
  cadre: string;
  questionsCount: number;
  durationMins: number;
  status: 'Published' | 'Draft' | 'Scheduled';
}

export const M3AssessmentCard: React.FC<{ item: AssessmentItem; onPublish: (title: string) => void }> = ({ item, onPublish }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="relative bg-white dark:bg-slate-900 rounded-[12px] border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-start mb-3">
          <span
            className={`px-3 py-1 rounded-[6px] text-[10px] font-bold tracking-wider ${
              item.status === 'Published'
                ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50'
                : 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border border-amber-200/50'
            }`}
          >
            {item.status}
          </span>

          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-600 dark:text-slate-300 transition-colors"
              aria-label="Options"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[12px] shadow-lg py-2 z-20">
                <button 
                  onClick={() => { onPublish(item.title); setMenuOpen(false); }}
                  className="w-full px-4 py-2 text-left text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 flex items-center gap-2"
                >
                  <Send className="w-4 h-4 text-slate-500" /> Publish to Cohort
                </button>
                <button 
                  onClick={() => { onPublish(`Scheduled ${item.title}`); setMenuOpen(false); }}
                  className="w-full px-4 py-2 text-left text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 flex items-center gap-2"
                >
                  <Calendar className="w-4 h-4 text-slate-500" /> Schedule Test
                </button>
                <div className="my-1 border-t border-slate-100 dark:border-slate-700" />
                <button 
                  onClick={() => { onPublish(`Removed ${item.title}`); setMenuOpen(false); }}
                  className="w-full px-4 py-2 text-left text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4 text-red-500" /> Delete
                </button>
              </div>
            )}
          </div>
        </div>

        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">{item.title}</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">Target Cadre: <span className="font-semibold text-slate-700 dark:text-slate-300">{item.cadre}</span></p>
      </div>

      <div className="pt-3 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
        <span className="flex items-center gap-1.5"><BookOpen className="w-4 h-4 text-slate-400" /> {item.questionsCount} Questions</span>
        <span>{item.durationMins} Mins</span>
      </div>
    </div>
  );
};

// --- MAIN SHOWCASE CONTAINER ---
export default function Material3Showcase() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'components'>('dashboard');
  
  // Showcase interactive states
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [bottomSheetOpen, setBottomSheetOpen] = useState(false);
  const [selectedM3Zone, setSelectedM3Zone] = useState<'North' | 'South' | 'West' | 'East'>('North');
  
  // Selection states
  const [switchA, setSwitchA] = useState(true);
  const [switchB, setSwitchB] = useState(false);
  const [competencyThreshold, setCompetencyThreshold] = useState(75);
  const [checkedA, setCheckedA] = useState(true);
  const [checkedB, setCheckedB] = useState(false);
  const [selectedCadreRadio, setSelectedCadreRadio] = useState<'jso' | 'sso' | 'iss'>('iss');
  const [selectedDate, setSelectedDate] = useState('2026-09-02');
  const [selectedTime, setSelectedTime] = useState('14:30');

  const sampleData: AssessmentItem[] = [
    { id: '1', title: 'NSSO 78th Round Sampling Verification', cadre: 'SSS-JSO 2026', questionsCount: 25, durationMins: 30, status: 'Published' },
    { id: '2', title: 'DPDP Act 2023 Data Privacy Compliance', cadre: 'ISS Probationers', questionsCount: 15, durationMins: 20, status: 'Draft' },
    { id: '3', title: 'CPI Statistics Calculation Mechanics', cadre: 'Field Enumerators', questionsCount: 20, durationMins: 25, status: 'Published' },
  ];

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const filteredAssessments = sampleData.filter(item => {
    if (selectedFilter === 'All') return true;
    if (selectedFilter === 'ISS' && item.cadre.includes('ISS')) return true;
    if (selectedFilter === 'SSS' && item.cadre.includes('SSS')) return true;
    if (selectedFilter === 'Field' && item.cadre.includes('Field')) return true;
    return true;
  });

  return (
    <div id="m3-showcase" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-[#CBD5E1] dark:border-[#49454F]/50">
      
      {/* Upper Spec Flag */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#1A365D]/10 text-[#1A365D] dark:text-[#93C5FD] text-xs font-bold rounded-full uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5 text-[#D97706]" /> Material Design 3 (M3) System
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight mt-3">
            MoSPI StatIQ Enterprise UI & Analytics
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mt-2 text-sm max-w-2xl leading-relaxed">
            Standardized color roles, responsive Recharts telemetry visualizations, custom vector graphic illustrations, and high-fidelity inputs built exclusively to Google's open-source design guidelines.
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex bg-[#E2E8F0] dark:bg-slate-800 p-1 rounded-full border border-slate-300 dark:border-slate-700">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`px-5 py-2 rounded-full text-xs font-bold transition-all ${activeTab === 'dashboard' ? 'bg-[#1A365D] text-white shadow-md' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/50'}`}
          >
            M3 Executive Dashboard
          </button>
          <button 
            onClick={() => setActiveTab('components')}
            className={`px-5 py-2 rounded-full text-xs font-bold transition-all ${activeTab === 'components' ? 'bg-[#1A365D] text-white shadow-md' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/50'}`}
          >
            M3 Core Library Playground
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'dashboard' ? (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-8"
          >
            {/* KPI Summary Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="bg-white dark:bg-slate-900 p-5 rounded-[16px] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-blue-50 dark:bg-blue-950/40 text-[#1A365D] dark:text-blue-300 rounded-[12px]">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Active Cadres Tracked</p>
                  <h4 className="text-xl font-black text-slate-900 dark:text-slate-100">1,240 Officers</h4>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-5 rounded-[16px] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 text-[#D97706] rounded-[12px]">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Question Pools</p>
                  <h4 className="text-xl font-black text-slate-900 dark:text-slate-100">34 Manuals</h4>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-5 rounded-[16px] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 rounded-[12px]">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Average FRAC Score</p>
                  <h4 className="text-xl font-black text-slate-900 dark:text-slate-100">4.1 / 5.0</h4>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-5 rounded-[16px] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-purple-50 dark:bg-purple-950/40 text-purple-600 rounded-[12px]">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">iGOT Sync Status</p>
                  <h4 className="text-xl font-black text-slate-900 dark:text-slate-100">Active (DPI-OK)</h4>
                </div>
              </div>
            </div>

            {/* Analytics Layer: Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <M3CompetencyRadar />
              <M3ZonalReadinessChart onTriggerWorkshop={() => triggerToast('Successfully drafted NSSTA Greater Noida Training Roster!')} />
            </div>

            {/* Admin Assessment Hub Component Core */}
            <div className="bg-slate-50 dark:bg-slate-950/40 p-6 rounded-[24px] border border-[#CBD5E1] dark:border-slate-800 space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#CBD5E1] dark:border-slate-800 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Assessments Hub</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Target cohort management lists, and proctored syllabus indicators</p>
                </div>
                <M3ExtendedFAB onClick={() => triggerToast('Initializing AI-assisted assessment draft model...')} />
              </div>

              {/* Filters & Search Row */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[28px] px-5 py-3 shadow-sm focus-within:ring-2 focus-within:ring-[#1A365D]">
                  <Search className="w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search assessments, circulars, or competency tags..."
                    className="w-full bg-transparent text-sm focus:outline-none text-slate-800 dark:text-slate-100 placeholder-slate-400"
                  />
                  <SlidersHorizontal className="w-5 h-5 text-slate-400 cursor-pointer" onClick={() => setBottomSheetOpen(true)} />
                </div>

                {/* Filter Chips Row */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mr-2 flex items-center gap-1 shrink-0">
                    <Filter className="w-3.5 h-3.5" /> Filters:
                  </span>
                  <M3FilterChip label="All Assessments" active={selectedFilter === 'All'} onClick={() => setSelectedFilter('All')} />
                  <M3FilterChip label="ISS Cadre" active={selectedFilter === 'ISS'} onClick={() => setSelectedFilter('ISS')} />
                  <M3FilterChip label="SSS / JSO" active={selectedFilter === 'SSS'} onClick={() => setSelectedFilter('SSS')} />
                  <M3FilterChip label="Field Enumerators" active={selectedFilter === 'Field'} onClick={() => setSelectedFilter('Field')} />
                </div>
              </div>

              {/* Assessment Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {filteredAssessments.map(item => (
                  <M3AssessmentCard 
                    key={item.id} 
                    item={item} 
                    onPublish={(title) => triggerToast(`Action confirmed: ${title}`)} 
                  />
                ))}
              </div>
            </div>

            {/* AI Ingestion Hero Banner with Vector Illustration */}
            <div className="bg-white dark:bg-slate-900 rounded-[24px] border border-slate-200 dark:border-slate-800 p-8 shadow-sm flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="space-y-4 max-w-xl">
                <span className="px-3 py-1 bg-amber-50 dark:bg-amber-950/40 text-[#D97706] text-xs font-bold rounded-full inline-flex items-center gap-1.5 border border-amber-200/50">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" /> AI Document-to-Assessment Engine
                </span>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                  Instantly convert NSSO manuals & circulars into verified question banks
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Upload official PDFs to execute strict Pydantic JSON question extraction with automatic Bloom’s taxonomy tagging and answer rationale indexing.
                </p>
                <button 
                  onClick={() => triggerToast('Redirecting to AI Generator Workspace...')}
                  className="px-6 py-3 bg-[#1A365D] hover:bg-[#0F294A] text-white font-semibold text-sm rounded-[12px] shadow flex items-center gap-2 transition-all"
                >
                  Launch AI Ingestion Hub <ChevronRight className="w-4 h-4 text-[#D97706]" />
                </button>
              </div>

              <div className="w-full md:w-auto">
                <M3AiIngestionIllustration />
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="components"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8"
          >
            {/* Quick Specs Drawer */}
            <div className="lg:col-span-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col gap-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <SlidersHorizontal className="w-5 h-5 text-[#1A365D]" /> M3 Interactive Values
                </h3>
                <p className="text-xs text-slate-500">Live variables reflecting interactive changes instantly</p>
              </div>

              {/* Selection Switches */}
              <div className="space-y-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Strict Proctored Session</p>
                    <p className="text-[10px] text-slate-400">Lock navigation & verify user ID</p>
                  </div>
                  <button 
                    onClick={() => setSwitchA(!switchA)}
                    className={`w-12 h-6 rounded-full p-1 transition-all flex items-center cursor-pointer ${switchA ? 'bg-[#1A365D]' : 'bg-slate-300 dark:bg-slate-700'}`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-all ${switchA ? 'translate-x-6' : 'translate-x-0'}`} />
                  </button>
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Daily iGOT Synchronization</p>
                    <p className="text-[10px] text-slate-400">Sync with authorized courses list</p>
                  </div>
                  <button 
                    onClick={() => setSwitchB(!switchB)}
                    className={`w-12 h-6 rounded-full p-1 transition-all flex items-center cursor-pointer ${switchB ? 'bg-[#1A365D]' : 'bg-slate-300 dark:bg-slate-700'}`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-all ${switchB ? 'translate-x-6' : 'translate-x-0'}`} />
                  </button>
                </div>
              </div>

              {/* Sliders */}
              <div className="space-y-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-700 dark:text-slate-300">Competency Threshold</span>
                    <span className="text-[#1A365D] dark:text-[#93C5FD] font-bold">{competencyThreshold}%</span>
                  </div>
                  <input 
                    type="range" min="30" max="95" value={competencyThreshold}
                    onChange={e => setCompetencyThreshold(Number(e.target.value))}
                    className="w-full accent-[#1A365D]"
                  />
                </div>
              </div>

              {/* Checkboxes & Radios */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Validation Mode</span>
                  <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <input type="checkbox" checked={checkedA} onChange={e => setCheckedA(e.target.checked)} className="rounded border-slate-300 text-[#1A365D] focus:ring-[#1A365D]" />
                    <span>MoSPI Rules</span>
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <input type="checkbox" checked={checkedB} onChange={e => setCheckedB(e.target.checked)} className="rounded border-slate-300 text-[#1A365D] focus:ring-[#1A365D]" />
                    <span>iGOT API</span>
                  </label>
                </div>

                <div className="space-y-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Default Cadre</span>
                  {(['jso', 'sso', 'iss'] as const).map(cadre => (
                    <label key={cadre} className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase">
                      <input 
                        type="radio" 
                        name="m3-cadre" 
                        checked={selectedCadreRadio === cadre}
                        onChange={() => setSelectedCadreRadio(cadre)}
                        className="text-[#1A365D] focus:ring-[#1A365D]" 
                      />
                      <span>{cadre}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* M3 Date & Time */}
              <div className="space-y-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Roster Launch Schedule</span>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-slate-400 font-bold uppercase">Date</label>
                    <input 
                      type="date" 
                      value={selectedDate}
                      onChange={e => setSelectedDate(e.target.value)}
                      className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs font-bold focus:outline-none" 
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-slate-400 font-bold uppercase">Time</label>
                    <input 
                      type="time" 
                      value={selectedTime}
                      onChange={e => setSelectedTime(e.target.value)}
                      className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs font-bold focus:outline-none" 
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Main Interactive Controls Grid */}
            <div className="lg:col-span-8 space-y-8">
              {/* Segmented / Split Buttons & Badges */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-6">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Actions & Buttons</h3>
                  <p className="text-xs text-slate-500">Segmented controls, split-actions, badges, and tooltips</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Segmented Buttons */}
                  <div className="space-y-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">M3 Segmented Button</span>
                    <div className="flex bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-0.5 rounded-full overflow-hidden">
                      {(['North', 'South', 'West', 'East'] as const).map(zone => (
                        <button
                          key={zone}
                          onClick={() => { setSelectedM3Zone(zone); triggerToast(`Swapped view to ${zone} NSSO Zone`); }}
                          className={`flex-1 text-[10px] font-bold uppercase tracking-wider py-2 transition-all ${selectedM3Zone === zone ? 'bg-[#1A365D] text-white rounded-full shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                        >
                          {zone}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Split Action */}
                  <div className="space-y-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">M3 Split Action Button</span>
                    <div className="flex bg-[#1A365D] text-white rounded-full overflow-hidden shadow-md">
                      <button onClick={() => triggerToast('Primary dispatch action triggered')} className="flex-1 py-3 text-xs font-bold hover:bg-[#0F294A] transition-colors text-center border-r border-white/10">
                        Dispatch Manual
                      </button>
                      <button onClick={() => setBottomSheetOpen(true)} className="px-4 hover:bg-[#0F294A] transition-colors flex items-center justify-center">
                        <SlidersHorizontal size={14} className="text-[#D97706]" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Badges, Tooltips & Linear Loaders */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Linear Progress</span>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className="h-full bg-[#1A365D] transition-all duration-300" style={{ width: `${competencyThreshold}%` }} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">M3 Notification Badges</span>
                    <div className="flex gap-4">
                      <div className="relative inline-block">
                        <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full">
                          <Bell size={18} />
                        </div>
                        <span className="absolute -top-1 -right-1 bg-[#D97706] text-white text-[9px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center border-2 border-white">
                          3
                        </span>
                      </div>
                      <div className="relative inline-block">
                        <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full">
                          <Shield size={18} />
                        </div>
                        <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Circular Progress</span>
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 border-3 border-slate-200 border-t-[#1A365D] rounded-full animate-spin" />
                      <span className="text-xs font-semibold text-slate-500">Syncing...</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Containment Cards & Custom M3 Lists */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Containment System</h3>
                  <p className="text-xs text-slate-500">Elevated cards, filled cards, and outlined containers</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-[#E2E8F0] dark:bg-slate-800 p-5 rounded-[16px] flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-[#1A365D] dark:text-blue-300 uppercase tracking-widest">Filled Container</span>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-2">National Accounts Division</h4>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">Providing dynamic proctoring benchmarks and competency matrix lists mapped directly to Authorized iGOT portals.</p>
                    </div>
                    <button 
                      onClick={() => setBottomSheetOpen(true)}
                      className="mt-4 bg-[#1A365D] hover:bg-[#0F294A] text-white text-xs font-bold py-2 px-4 rounded-full self-start transition-all"
                    >
                      Configure Drawer
                    </button>
                  </div>

                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-[16px] flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Outlined Container</span>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-2">NSSO Sampling Framework</h4>
                      <p className="text-xs text-slate-500 mt-1">High contrast parameters with custom sliders, switches, and split-actions displaying micro-stratification protocols.</p>
                    </div>
                    <button 
                      onClick={() => triggerToast('Opening rulebooks detailed modal...')}
                      className="mt-4 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold py-2 px-4 rounded-full self-start hover:bg-slate-50 transition-all"
                    >
                      View Documents
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Slide-Up Modal Bottom Sheet Detail Drawer */}
      <AnimatePresence>
        {bottomSheetOpen && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setBottomSheetOpen(false)}
              className="fixed inset-0 bg-black z-40"
            />
            {/* Draggable Bottom Sheet Container */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed bottom-0 left-0 right-0 max-w-2xl mx-auto bg-white dark:bg-slate-900 rounded-t-[28px] border-t border-slate-200 dark:border-slate-700 shadow-2xl z-50 p-6"
            >
              <div className="w-12 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-4" />
              
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <SlidersHorizontal className="w-5 h-5 text-[#D97706]" /> M3 Interactive Drawer Controls
                  </h3>
                  <p className="text-xs text-slate-500">Configure global testing variables, proctor loops, and cadre roles</p>
                </div>
                <button onClick={() => setBottomSheetOpen(false)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-6">
                <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800 space-y-4">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-700 dark:text-slate-300">Default Assessment Duration</span>
                    <span className="text-[#1A365D] dark:text-blue-400 font-extrabold">{selectedM3Zone === 'North' ? '30 Mins' : '45 Mins'}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-700 dark:text-slate-300">Continuous Assessment Logic</span>
                    <span className="text-emerald-600 font-bold">Enabled</span>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={() => { triggerToast('Global changes successfully deployed!'); setBottomSheetOpen(false); }}
                    className="flex-1 bg-[#1A365D] hover:bg-[#0F294A] text-white font-bold text-xs py-3 rounded-full transition-all text-center"
                  >
                    Confirm & Apply
                  </button>
                  <button 
                    onClick={() => setBottomSheetOpen(false)}
                    className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs py-3 rounded-full transition-all text-center"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Floating Action Alert / Snackbar System */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            className="fixed bottom-6 left-6 right-6 md:left-auto md:right-12 bg-slate-900 text-white px-5 py-4 rounded-[12px] shadow-2xl z-50 flex items-center justify-between gap-4 max-w-sm"
          >
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-[#D97706] shrink-0" />
              <span className="text-xs font-bold leading-tight">{toastMessage}</span>
            </div>
            <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white shrink-0">
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
