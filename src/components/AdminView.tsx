import React, { useState } from 'react';
import { ViewState } from '../types';
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
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

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
  const [filter, setFilter] = useState('All Zones');
  const [selectedCell, setSelectedCell] = useState<{zone: string, topic: string, score: number} | null>(null);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto flex flex-col gap-8 pb-20 md:pb-8 font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-2 tracking-tight">Admin Analytics</h1>
          <p className="text-slate-500 font-medium text-sm md:text-base">Monitoring structural competency and assessment metrics across MoSPI divisions.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="w-full sm:w-auto flex items-center gap-2 bg-surface border border-border-color px-4 py-2 rounded-full text-sm font-bold text-slate-600 shadow-sm cursor-pointer hover:bg-background focus-within:border-primary">
            <Filter size={16} className="text-slate-400" />
            <select value={filter} onChange={e => setFilter(e.target.value)} className="bg-transparent border-none outline-none cursor-pointer w-full appearance-none pr-4">
              <option>All Zones</option>
              <option>North Zone</option>
              <option>South Zone</option>
              <option>East Zone</option>
              <option>West Zone</option>
            </select>
          </div>
          <button onClick={() => {
            const btn = document.activeElement as HTMLButtonElement;
            const originalText = btn.innerHTML;
            btn.innerHTML = 'Generating PDF...';
            setTimeout(() => { btn.innerHTML = originalText; }, 2000);
          }} className="w-full sm:w-auto px-6 py-2.5 bg-primary border-2 border-primary rounded-full text-sm font-bold text-white hover:bg-primary-light hover:border-primary-light transition-all flex items-center justify-center gap-2 shadow-md active:scale-95 min-h-[44px]">
            <FileText size={16} /> Generate TNA Memo
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div variants={itemVariants} className="bg-surface border border-border-color rounded-[20px] p-8 shadow-sm flex flex-col hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Assessments</h3>
            <div className="p-3 bg-primary/10 rounded-full text-primary">
              <ClipboardList size={24} />
            </div>
          </div>
          <div className="text-5xl font-black text-slate-900 mb-3 tracking-tight">1,248</div>
          <div className="flex items-center gap-1.5 text-green-600 text-sm font-bold bg-green-50 w-fit px-4 py-1.5 rounded-full border border-green-200">
            <TrendingUp size={16} strokeWidth={3} /> +12% from Q2
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-surface border border-border-color rounded-[20px] p-8 shadow-sm flex flex-col hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Participation</h3>
            <div className="p-3 bg-accent/10 rounded-full text-accent">
              <Users size={24} />
            </div>
          </div>
          <div className="text-5xl font-black text-slate-900 mb-3 tracking-tight">84.2%</div>
          <div className="flex items-center gap-1.5 text-green-600 text-sm font-bold bg-green-50 w-fit px-4 py-1.5 rounded-full border border-green-200">
            <TrendingUp size={16} strokeWidth={3} /> Target exceeded
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-gradient-to-br from-primary to-primary-light rounded-[20px] p-8 shadow-lg flex flex-col text-white relative overflow-hidden group">
          <div className="absolute -right-12 -top-12 w-48 h-48 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-colors"></div>
          <div className="flex justify-between items-start mb-6 relative z-10">
            <h3 className="text-xs font-bold text-primary-fixed-dim uppercase tracking-widest">FRAC Skill Gap Delta</h3>
            <div className="p-3 bg-white/10 rounded-full text-white backdrop-blur-sm">
              <BarChart size={24} />
            </div>
          </div>
          <div className="text-5xl font-black text-white mb-3 tracking-tight relative z-10">-15%</div>
          <div className="text-sm font-semibold text-primary-fixed relative z-10 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            National Average Deficit
          </div>
        </motion.div>
      </motion.div>

      {/* Main Grid */}
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Zonal Competency Matrix */}
        <motion.div variants={itemVariants} className="xl:col-span-2 bg-surface border border-border-color rounded-[20px] overflow-hidden shadow-sm flex flex-col relative">
          <div className="p-8 border-b border-border-color flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">FRAC Competency Heatmap</h2>
              <p className="text-sm font-medium text-slate-500 mt-1">Click any zone metric for drill-down routing.</p>
            </div>
            <span className="bg-background text-slate-600 px-4 py-1.5 rounded-full text-xs font-bold border border-border-color shadow-sm w-fit">FOD Zones</span>
          </div>
          
          <div className="p-8 flex-1 flex flex-col bg-background/50">
            <div className="overflow-x-auto">
              <div className="min-w-[600px]">
                {/* Headers */}
                <div className="grid grid-cols-6 gap-3 mb-6">
                  <div className="col-span-1"></div>
                  {['North', 'South', 'East', 'West', 'Central'].map(zone => (
                    <div key={zone} className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest">{zone}</div>
                  ))}
                </div>

                {/* Rows */}
                {[
                  { name: 'Survey Design', scores: [85, 92, 70, 78, 88] },
                  { name: 'Variance Est.', scores: [82, 89, 60, 84, 91] },
                  { name: 'Data Validation', scores: [90, 94, 80, 87, 85] }
                ].map((row, i) => (
                  <div key={i} className="grid grid-cols-6 gap-3 mb-3 items-center group">
                    <div className="text-right pr-6 text-sm font-extrabold text-slate-700 leading-tight group-hover:text-primary transition-colors">{row.name}</div>
                    {row.scores.map((score, j) => {
                      const opacity = Math.max(0.2, (score - 50) / 50);
                      const isHigh = score >= 90;
                      const isLow = score < 70;
                      const zoneName = ['North', 'South', 'East', 'West', 'Central'][j];
                      return (
                        <button 
                          key={j}
                          onClick={() => setSelectedCell({ zone: zoneName, topic: row.name, score })}
                          className={`h-16 rounded-[20px] flex items-center justify-center text-white font-mono text-sm font-bold shadow-sm transition-all hover:scale-[1.05] hover:shadow-md cursor-pointer relative outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 min-h-[44px] ${isHigh ? 'ring-2 ring-green-400 ring-offset-2' : ''}`}
                          style={{ backgroundColor: `rgba(15, 44, 89, ${opacity})` }}
                          aria-label={`Score ${score} for ${zoneName} zone in ${row.name}`}
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
            
            <div className="flex flex-wrap items-center justify-center gap-6 mt-8 pt-6 border-t border-border-color">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500"><div className="w-3 h-3 rounded bg-primary/20"></div> Needs Focus</div>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500"><div className="w-3 h-3 rounded bg-primary/60"></div> On Track</div>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500"><div className="w-3 h-3 rounded bg-primary ring-2 ring-green-400 ring-offset-1"></div> Excelling</div>
            </div>
          </div>

          {/* Drill-down Modal/Popover Simulation */}
          <AnimatePresence>
            {selectedCell && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white p-5 rounded-[20px] shadow-2xl border border-slate-700 w-[90%] max-w-md flex flex-col gap-4 z-20"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-lg">{selectedCell.zone} Zone: {selectedCell.topic}</h4>
                    <p className="text-slate-400 text-sm font-medium">Proficiency Score: {selectedCell.score}%</p>
                  </div>
                  <button onClick={() => setSelectedCell(null)} className="text-slate-400 hover:text-white p-1 rounded-md min-h-[44px] min-w-[44px] flex items-center justify-center">✕</button>
                </div>
                {selectedCell.score < 75 ? (
                  <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400 block mb-1">Recommended Action</span>
                    <p className="text-sm font-medium leading-relaxed">Schedule targeted iGOT module <span className="text-white font-bold">"Advanced {selectedCell.topic}"</span> for 14 active officers in this zone.</p>
                    <button className="mt-3 w-full bg-white text-slate-900 text-sm font-bold py-3 rounded-full hover:bg-slate-100 transition-colors">Route to iGOT</button>
                  </div>
                ) : (
                  <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-green-400 block mb-1">Status</span>
                    <p className="text-sm font-medium leading-relaxed">Zone is operating above baseline benchmark. No immediate intervention required.</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* iGOT Remediation Timeline */}
        <motion.div variants={itemVariants} className="xl:col-span-1 bg-surface border border-border-color rounded-[20px] overflow-hidden shadow-sm flex flex-col">
          <div className="p-8 border-b border-border-color">
            <h2 className="text-xl font-extrabold text-slate-900 mb-1">iGOT Remediation Cohorts</h2>
            <p className="text-sm font-medium text-slate-500">Post-assessment upskilling timeline.</p>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6">
            <div className="relative border-l-2 border-border-color ml-3 flex flex-col gap-8 pb-4">
              
              <div className="relative pl-6">
                <div className="absolute w-4 h-4 bg-green-500 rounded-full border-4 border-white -left-[9px] top-1 shadow-sm"></div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Week 1-2 (Completed)</div>
                <div className="bg-background p-4 rounded-xl border border-border-color hover:border-slate-300 transition-colors">
                  <div className="font-bold text-slate-900 text-sm mb-1">North Zone: Basic Sampling</div>
                  <div className="text-xs font-medium text-slate-500 mb-3">42 JSOs completed module.</div>
                  <div className="flex items-center gap-1.5 text-green-600 text-xs font-bold bg-green-50 w-fit px-3 py-1.5 rounded-full border border-green-200">
                    <TrendingUp size={12} strokeWidth={3} /> +18% Competency Lift
                  </div>
                </div>
              </div>

              <div className="relative pl-6">
                <div className="absolute w-4 h-4 bg-blue-500 rounded-full border-4 border-white -left-[9px] top-1 shadow-sm animate-pulse"></div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Week 3-4 (Active)</div>
                <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                  <div className="font-bold text-slate-900 text-sm mb-1">East Zone: Variance Est.</div>
                  <div className="text-xs font-medium text-slate-500 mb-3">18 Officers currently enrolled.</div>
                  <div className="w-full h-1.5 bg-blue-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 w-[65%] rounded-full"></div>
                  </div>
                </div>
              </div>

              <div className="relative pl-6">
                <div className="absolute w-4 h-4 bg-slate-300 rounded-full border-4 border-white -left-[9px] top-1 shadow-sm"></div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Week 5 (Scheduled)</div>
                <div className="bg-background p-4 rounded-xl border border-border-color border-dashed">
                  <div className="font-bold text-slate-500 text-sm mb-1">South Zone: Data Privacy</div>
                  <div className="text-xs font-medium text-slate-400">Pending TNA memo generation.</div>
                </div>
              </div>

            </div>
          </div>
          
          <div className="p-6 border-t border-border-color bg-background/50">
            <button 
              className="w-full py-3.5 bg-surface border border-border-color text-slate-700 rounded-full hover:border-primary hover:text-primary transition-all text-sm font-bold flex items-center justify-center gap-2 shadow-sm active:scale-95 min-h-[44px]"
            >
              <Target size={18} /> Manage iGOT Assignments
            </button>
          </div>
        </motion.div>
        
      </motion.div>
    </div>
  );
}

