import React, { useState } from 'react';
import { ViewState } from '../types';
import { Material3Layout } from './Material3Layout';
import { 
  Download, 
  ClipboardList, 
  Users, 
  TrendingUp,
  FileText,
  RefreshCw,
  Filter,
  BarChart,
  Target,
  ArrowRight,
  Plus,
  MoreVertical,
  Calendar,
  Trash2,
  Edit,
  Send,
  PieChart
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useEffect } from 'react';
import { MCQGeneratorDialog } from './MCQGeneratorDialog';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};

export function AdminView({ setCurrentView }: { setCurrentView: (v: ViewState) => void }) {
  const [activeTab, setActiveTab] = useState<'analytics' | 'assessments'>('analytics');
  const [filter, setFilter] = useState('All Cohorts');
  const [zoneFilter, setZoneFilter] = useState('All Zones');
  const [selectedCell, setSelectedCell] = useState<{zone: string, topic: string, score: number} | null>(null);
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);

  const [assessments, setAssessments] = useState<any[]>([]);
  
  useEffect(() => {
    const q = query(collection(db, 'assessments'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Map fields for the UI
        title: doc.data().title || 'Untitled Assessment',
        status: 'Published', // Mocked status since they are pushed
        cohort: 'All Cohorts',
        date: doc.data().createdAt ? new Date(doc.data().createdAt.toDate()).toLocaleDateString() : 'Just now',
        questions: (doc.data().questions || []).length
      }));
      setAssessments(fetched);
    });
    return () => unsubscribe();
  }, []);

  const [openDropdown, setOpenDropdown] = useState<number | null>(null);

  return (
    <Material3Layout title="Admin Operations" subtitle="Analyze aggregate performance, track regional skill indexes, and manage MoSPI assessments.">
      <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto flex flex-col gap-8 pb-20 md:pb-8 font-sans">
        
        {/* Header & Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E7E0EC] dark:border-[#49454F]/50 pb-4">
          <div>
            <div className="flex gap-6 border-b border-transparent">
              <button 
                onClick={() => setActiveTab('analytics')}
                className={`pb-2 text-sm font-bold transition-all relative ${activeTab === 'analytics' ? 'text-[#6750A4] dark:text-[#D0BCFF]' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Master Analytics
                {activeTab === 'analytics' && <motion.div layoutId="admintab" className="absolute bottom-0 left-0 right-0 h-1 bg-[#6750A4] dark:bg-[#D0BCFF] rounded-t-full" />}
              </button>
              <button 
                onClick={() => setActiveTab('assessments')}
                className={`pb-2 text-sm font-bold transition-all relative ${activeTab === 'assessments' ? 'text-[#6750A4] dark:text-[#D0BCFF]' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Assessment Manager
                {activeTab === 'assessments' && <motion.div layoutId="admintab" className="absolute bottom-0 left-0 right-0 h-1 bg-[#6750A4] dark:bg-[#D0BCFF] rounded-t-full" />}
              </button>
            </div>
          </div>
          
          {activeTab === 'analytics' ? (
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="w-full sm:w-auto flex items-center gap-2 bg-white dark:bg-slate-900 border border-[#E7E0EC] dark:border-[#49454F]/50 px-4 py-2 rounded-full text-sm font-bold text-slate-600 dark:text-slate-300 shadow-sm focus-within:border-[#6750A4]">
                <Filter size={16} className="text-[#6750A4] dark:text-[#D0BCFF]" />
                <select value={zoneFilter} onChange={e => setZoneFilter(e.target.value)} className="bg-transparent border-none outline-none cursor-pointer w-full appearance-none pr-4">
                  <option>All Zones</option>
                  <option>North Zone</option>
                  <option>South Zone</option>
                  <option>East Zone</option>
                  <option>West Zone</option>
                </select>
              </div>
              <button className="w-full sm:w-auto px-6 py-2.5 bg-[#6750A4] hover:bg-[#4F378B] rounded-full text-sm font-bold text-white transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg">
                <FileText size={16} /> Generate TNA Memo
              </button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="w-full sm:w-auto flex items-center gap-2 bg-white dark:bg-slate-900 border border-[#E7E0EC] dark:border-[#49454F]/50 px-4 py-2 rounded-full text-sm font-bold text-slate-600 dark:text-slate-300 shadow-sm focus-within:border-[#6750A4]">
                <Filter size={16} className="text-[#6750A4] dark:text-[#D0BCFF]" />
                <select value={filter} onChange={e => setFilter(e.target.value)} className="bg-transparent border-none outline-none cursor-pointer w-full appearance-none pr-4">
                  <option>All Cohorts</option>
                  <option>ISS Probationers</option>
                  <option>SSS-JSO 2026</option>
                  <option>Field Enumerators</option>
                </select>
              </div>
              <button 
                onClick={() => setIsGeneratorOpen(true)}
                className="w-full sm:w-auto px-6 py-2.5 bg-[#6750A4] hover:bg-[#4F378B] rounded-full text-sm font-bold text-white transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
              >
                <Plus size={16} strokeWidth={3} /> New Assessment
              </button>
            </div>
          )}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'analytics' && (
            <motion.div 
              key="analytics"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="flex flex-col gap-8"
            >
              {/* High-level KPIs */}
              <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900 border border-[#E7E0EC] dark:border-[#49454F]/50 p-6 rounded-2xl shadow-sm flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-900/30">
                    <Users size={24} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Active Officers</p>
                    <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">4,281</p>
                  </div>
                </motion.div>
                <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900 border border-[#E7E0EC] dark:border-[#49454F]/50 p-6 rounded-2xl shadow-sm flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 flex items-center justify-center border border-green-100 dark:border-green-900/30">
                    <ClipboardList size={24} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Assessments Completed</p>
                    <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">12,490</p>
                  </div>
                </motion.div>
                <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900 border border-[#E7E0EC] dark:border-[#49454F]/50 p-6 rounded-2xl shadow-sm flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-[#EADDFF] dark:bg-[#381E72]/40 text-[#21005D] dark:text-[#EADDFF] flex items-center justify-center border border-transparent">
                    <Target size={24} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Avg Competency Score</p>
                    <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">76.4%</p>
                  </div>
                </motion.div>
              </motion.div>

              {/* Zonal Competency Heatmap */}
              <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                <motion.div variants={itemVariants} className="xl:col-span-2 bg-white dark:bg-slate-900 border border-[#E7E0EC] dark:border-[#49454F]/50 rounded-2xl overflow-hidden shadow-sm flex flex-col">
                  <div className="p-8 border-b border-[#E7E0EC] dark:border-[#49454F]/50 flex justify-between items-center bg-slate-50 dark:bg-slate-950/40">
                    <div>
                      <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 mb-1 tracking-tight">FRAC Competency Matrix</h2>
                      <p className="text-sm font-medium text-slate-500">Zonal proficiency across key statistical modules.</p>
                    </div>
                  </div>
                  <div className="p-8 flex-1 overflow-x-auto">
                    <div className="min-w-[600px]">
                      <div className="grid grid-cols-6 gap-3 mb-4 text-center">
                        <div></div>
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">North</div>
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">South</div>
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">East</div>
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">West</div>
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Central</div>
                      </div>
                      {[
                        { name: 'Sampling Tech', scores: [85, 92, 78, 64, 88] },
                        { name: 'Nat. Accounts', scores: [72, 88, 91, 75, 82] },
                        { name: 'Survey Design', scores: [94, 81, 68, 85, 90] },
                        { name: 'Price Indices', scores: [65, 76, 82, 95, 78] },
                        { name: 'Data Privacy', scores: [88, 90, 85, 82, 89] },
                      ].map((row, i) => (
                        <div key={i} className="grid grid-cols-6 gap-3 mb-3 items-center group">
                          <div className="text-right pr-6 text-sm font-extrabold text-slate-700 dark:text-slate-300 leading-tight group-hover:text-[#6750A4] dark:group-hover:text-[#D0BCFF] transition-colors">{row.name}</div>
                          {row.scores.map((score, j) => {
                            const opacity = Math.max(0.2, (score - 50) / 50);
                            const isHigh = score >= 90;
                            const isLow = score < 70;
                            const zoneName = ['North', 'South', 'East', 'West', 'Central'][j];
                            return (
                              <button 
                                key={j}
                                onClick={() => setSelectedCell({ zone: zoneName, topic: row.name, score })}
                                className={`h-16 rounded-xl flex items-center justify-center text-white font-mono text-sm font-bold shadow-sm transition-all hover:scale-[1.05] hover:shadow-md cursor-pointer relative outline-none focus:ring-2 focus:ring-[#6750A4] focus:ring-offset-2 min-h-[44px] ${isHigh ? 'ring-2 ring-green-400 ring-offset-2' : ''}`}
                                style={{ backgroundColor: `rgba(103, 80, 164, ${opacity})` }}
                              >
                                {score}
                                {isLow && <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-red-400 shadow-sm animate-pulse"></span>}
                              </button>
                            )
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>

                {/* Remediation Sidebar */}
                <motion.div variants={itemVariants} className="xl:col-span-1 bg-white dark:bg-slate-900 border border-[#E7E0EC] dark:border-[#49454F]/50 rounded-2xl overflow-hidden shadow-sm flex flex-col">
                  <div className="p-8 border-b border-[#E7E0EC] dark:border-[#49454F]/50 bg-slate-50 dark:bg-slate-950/40">
                    <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 mb-1 tracking-tight">TPAC Nomination Roster</h2>
                    <p className="text-sm font-medium text-slate-500">Automated NSSTA intervention triggers.</p>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6">
                    {selectedCell && selectedCell.score < 75 ? (
                      <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 p-5 rounded-2xl mb-6 shadow-sm">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-red-600 dark:text-red-400 block mb-2">Automated Alert</span>
                        <p className="text-sm font-medium text-slate-850 dark:text-slate-200 mb-4">
                          Aggregate failure rate in <span className="font-bold">{selectedCell.zone} Zone</span> for <span className="font-bold">{selectedCell.topic}</span> exceeds 40%.
                        </p>
                        <button className="w-full bg-white dark:bg-slate-800 border border-red-200 dark:border-red-900/30 text-red-750 dark:text-red-300 text-sm font-bold py-2.5 rounded-full hover:bg-red-100 transition-colors shadow-sm">
                          Draft Nomination Memo
                        </button>
                      </div>
                    ) : (
                      <div className="bg-slate-50 dark:bg-slate-950/40 border border-[#E7E0EC] dark:border-[#49454F]/50 p-5 rounded-2xl mb-6">
                        <p className="text-sm font-medium text-slate-500 text-center">Select a low-scoring cell (red dot) on the heatmap to generate a TPAC nomination.</p>
                      </div>
                    )}
                    
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Active iGOT Mandates</h3>
                    <div className="space-y-4">
                      <div className="bg-slate-50 dark:bg-slate-950/40 p-4 rounded-2xl border border-[#E7E0EC] dark:border-[#49454F]/50">
                        <div className="font-bold text-slate-900 dark:text-slate-100 text-sm mb-1">West Zone: Sampling Tech</div>
                        <div className="text-xs font-medium text-slate-500 mb-3">42 JSOs enrolled via NSSTA.</div>
                        <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-[#6750A4] w-[45%] rounded-full"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </motion.div>
          )}

          {activeTab === 'assessments' && (
            <motion.div 
              key="assessments"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {assessments.map(assessment => (
                <div key={assessment.id} className="bg-white dark:bg-slate-900 border border-[#E7E0EC] dark:border-[#49454F]/50 rounded-2xl p-6 shadow-sm hover:border-[#6750A4] dark:hover:border-[#D0BCFF] transition-colors flex flex-col relative">
                  <div className="flex justify-between items-start mb-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border tracking-wider
                      ${assessment.status === 'Published' ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-200/50' : 
                        assessment.status === 'Draft' ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-400 border-amber-200/50' : 
                        'bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 border-blue-200/50'}
                    `}>
                      {assessment.status.toUpperCase()}
                    </span>
                    <div className="relative">
                      <button 
                        onClick={() => setOpenDropdown(openDropdown === assessment.id ? null : assessment.id)}
                        className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors focus:ring-2 focus:ring-primary focus:outline-none"
                      >
                        <MoreVertical size={18} />
                      </button>
                      {openDropdown === assessment.id && (
                        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-[#E7E0EC] dark:border-[#49454F]/50 py-1 z-20 overflow-hidden">
                          <button className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"><Send size={14}/> Publish to Cadre</button>
                          <button onClick={() => setCurrentView('generator')} className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"><Edit size={14}/> Edit Assessment</button>
                          <button className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"><Calendar size={14}/> Schedule Deployment</button>
                          <button className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"><PieChart size={14}/> Specific Analytics</button>
                          <div className="h-px bg-slate-100 dark:bg-slate-700 my-1"></div>
                          <button className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"><Trash2 size={14}/> Delete</button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <h3 className="font-extrabold text-lg text-slate-900 dark:text-slate-100 mb-2 leading-tight tracking-tight">{assessment.title}</h3>
                  
                  <div className="mt-auto pt-4 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Target Cohort</p>
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-300 truncate">{assessment.cohort}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Questions</p>
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{assessment.questions} MCQs</p>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {isGeneratorOpen && (
          <MCQGeneratorDialog 
            isOpen={isGeneratorOpen} 
            onClose={() => setIsGeneratorOpen(false)} 
            setCurrentView={setCurrentView}
          />
        )}
      </AnimatePresence>
    </Material3Layout>
  );
}
