import React, { useState, useEffect } from 'react';
import { ViewState } from '../types';
import { PlayCircle, ChevronLeft, ChevronRight, Play, AlertCircle, Clock, Target, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../lib/AuthContext';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

interface Competency {
  subject: string;
  current: number;
  benchmark: number;
  delta?: number;
}

export function LearnerView({ setCurrentView }: { setCurrentView: (view: ViewState) => void }) {
  const { user } = useAuth();
  const [radarData, setRadarData] = useState<Competency[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Mock service to fetch and calculate deltas
    const fetchCompetencyData = async () => {
      const rawData = [
        { subject: 'Sampling', current: 5, benchmark: 5 },
        { subject: 'Accounts', current: 5, benchmark: 5 },
        { subject: 'Indices', current: 5, benchmark: 4 },
        { subject: 'Python/R', current: 4, benchmark: 5 },
        { subject: 'GIS', current: 5, benchmark: 4 },
        { subject: 'Governance', current: 4, benchmark: 5 },
        { subject: 'Quality', current: 5, benchmark: 5 },
        { subject: 'Field Ops', current: 4, benchmark: 5 },
      ];
      
      const enrichedData = rawData.map(item => ({
        ...item,
        delta: item.benchmark - item.current
      }));
      
      // Simulate network request
      setTimeout(() => {
        setRadarData(enrichedData);
        setIsLoading(false);
      }, 800);
    };

    fetchCompetencyData();
  }, []);

  const skillGaps = radarData.filter(d => (d.delta || 0) > 0);

  return (
    <div className="flex-1 flex w-full relative">
      {/* Main Content Area */}
      <div className="flex-1 p-4 md:p-8 pt-6 space-y-8 max-w-7xl mx-auto w-full xl:mr-80">
        
        {/* Hero Banner */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-primary to-primary-light rounded-[20px] p-8 flex items-center justify-between shadow-[0px_14px_42px_rgba(8,15,52,0.06)] text-white relative overflow-hidden"
        >
          {/* Abstract Background Elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
          <div className="absolute bottom-0 left-1/4 w-48 h-48 bg-secondary/20 rounded-full blur-2xl translate-y-1/2"></div>
          
          <div className="relative z-10 max-w-lg">
            <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-[11px] font-medium leading-[14px] mb-4 backdrop-blur-sm tracking-wide">
              NEW COURSES ADDED
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mb-6 leading-tight tracking-tight">
              Sharpen Your Skills With Professional Online Courses
            </h2>
            <button 
              onClick={() => setCurrentView('assessment')}
              className="bg-white text-primary px-6 py-3 rounded-full text-sm font-semibold flex items-center gap-2 hover:bg-slate-50 transition-colors shadow-lg active:scale-95"
            >
              Take Assessment
              <PlayCircle size={20} className="fill-primary text-white" />
            </button>
          </div>
          
          <div className="hidden lg:block relative z-10 w-48 h-48 shrink-0">
            <img 
              src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=400&q=80" 
              alt="Professional learning" 
              className="w-full h-full object-cover rounded-2xl shadow-2xl border-4 border-white/10"
            />
          </div>
        </motion.div>

        {/* Continue Watching */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Continue Watching</h3>
            <div className="flex gap-2">
              <button className="w-8 h-8 rounded-full border border-border-color flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500">
                <ChevronLeft size={16} />
              </button>
              <button className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary-light transition-colors shadow-sm">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Course Card 1 */}
            <div className="bg-white dark:bg-slate-900 rounded-[20px] p-4 shadow-sm border border-border-color flex gap-4 items-center group cursor-pointer hover:-translate-y-1 transition-transform">
              <div className="w-24 h-24 rounded-xl overflow-hidden relative shrink-0">
                <img 
                  src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=200&q=80" 
                  alt="Data Analytics" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Play className="text-white fill-white" size={24} />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-2">
                  <span className="px-2 py-1 bg-primary/10 text-primary text-[11px] font-semibold rounded-md uppercase tracking-wider">Frontend</span>
                  <span className="text-[11px] font-medium text-slate-500">2/8 Watched</span>
                </div>
                <h4 className="text-sm font-bold mb-2 truncate group-hover:text-primary transition-colors text-slate-900 dark:text-white">Beginner's Guide to Product Design</h4>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mb-3">
                  <div className="bg-gradient-to-r from-primary to-secondary h-1.5 rounded-full" style={{ width: '25%' }}></div>
                </div>
                <div className="flex items-center gap-2">
                  <img src="https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=64&q=80" alt="Instructor" className="w-6 h-6 rounded-full object-cover" />
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Dr. Sarah Jenkins</span>
                </div>
              </div>
            </div>

            {/* Course Card 2 */}
            <div className="bg-white dark:bg-slate-900 rounded-[20px] p-4 shadow-sm border border-border-color flex gap-4 items-center group cursor-pointer hover:-translate-y-1 transition-transform">
              <div className="w-24 h-24 rounded-xl overflow-hidden relative shrink-0">
                <img 
                  src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=200&q=80" 
                  alt="Data Analytics" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Play className="text-white fill-white" size={24} />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-2">
                  <span className="px-2 py-1 bg-secondary/10 text-secondary text-[11px] font-semibold rounded-md uppercase tracking-wider">Data Science</span>
                  <span className="text-[11px] font-medium text-slate-500">5/12 Watched</span>
                </div>
                <h4 className="text-sm font-bold mb-2 truncate group-hover:text-primary transition-colors text-slate-900 dark:text-white">Advanced Statistical Analysis</h4>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mb-3">
                  <div className="bg-gradient-to-r from-primary to-secondary h-1.5 rounded-full" style={{ width: '45%' }}></div>
                </div>
                <div className="flex items-center gap-2">
                  <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=64&q=80" alt="Instructor" className="w-6 h-6 rounded-full object-cover" />
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Prof. Alan Turing</span>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Required Assessments */}
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="lg:col-span-2 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Required Assessments</h3>
            </div>
            
            <div className="flex flex-col gap-4 flex-1">
              {/* Overdue Card */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-red-200 dark:border-red-900/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 transition-colors hover:bg-red-50/30 dark:hover:bg-red-900/10">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                    <AlertCircle size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h4 className="text-base font-semibold text-slate-900 dark:text-white">Data Privacy & Ethics Refresher</h4>
                      <span className="px-2 py-0.5 bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 text-[11px] font-bold tracking-wide rounded-md uppercase">Overdue</span>
                    </div>
                    <p className="text-sm text-slate-500 mb-2">Mandatory compliance module for all Data Strategy Division personnel.</p>
                    <div className="flex items-center gap-4 text-xs font-medium text-slate-400">
                      <span className="flex items-center gap-1.5"><Clock size={14} /> 30 Mins</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => setCurrentView('assessment')} className="w-full sm:w-auto px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-full text-sm font-medium transition-colors active:scale-95 whitespace-nowrap">
                  Start Now
                </button>
              </div>

              {/* Dynamic Pending Cards based on Skill Gaps */}
              {isLoading ? (
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-border-color flex items-center justify-center flex-1 min-h-[100px]">
                  <Loader2 className="animate-spin text-slate-400" size={24} />
                </div>
              ) : (
                skillGaps.map((gap, index) => (
                  <motion.div 
                    key={gap.subject}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-border-color flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 transition-colors hover:border-slate-300 dark:hover:border-slate-700 flex-1"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center shrink-0">
                        <Target size={20} />
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h4 className="text-base font-semibold text-slate-900 dark:text-white">{gap.subject} Foundations</h4>
                          <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[11px] font-bold tracking-wide rounded-md uppercase">Pending</span>
                        </div>
                        <p className="text-sm text-slate-500 mb-2">Mapped to FRAC Competency Gap: {gap.subject} (Level {gap.benchmark} required)</p>
                        <div className="flex items-center gap-4 text-xs font-medium text-slate-400">
                          <span className="flex items-center gap-1.5"><Clock size={14} /> 45 Mins</span>
                        </div>
                      </div>
                    </div>
                    <button onClick={() => setCurrentView('assessment')} className="w-full sm:w-auto px-5 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 rounded-full text-sm font-medium transition-colors active:scale-95 whitespace-nowrap">
                      Start Assessment
                    </button>
                  </motion.div>
                ))
              )}
            </div>
          </motion.section>
        </div>
      </div>

      {/* Right Sidebar (Profile & Activity) */}
      <aside className="fixed right-0 top-16 h-[calc(100vh-64px)] w-80 bg-white dark:bg-slate-900 border-l border-border-color flex-col z-10 hidden xl:flex overflow-y-auto">
        {/* Profile Header */}
        <div className="p-8 pb-6 text-center border-b border-border-color">
          <div className="relative inline-block mb-4">
            {/* Circular Progress Avatar Placeholder */}
            <div className="w-24 h-24 rounded-full border-4 border-slate-100 dark:border-slate-800 flex items-center justify-center relative">
              {/* Faux progress ring */}
              <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle className="drop-shadow-md" cx="50" cy="50" fill="transparent" r="46" stroke="var(--color-primary)" strokeDasharray="289" strokeDashoffset="60" strokeWidth="8"></circle>
              </svg>
              {user?.photoURL ? (
                <img src={user.photoURL} alt="Profile" className="w-20 h-20 rounded-full object-cover" />
              ) : (
                <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80" alt="Profile placeholder" className="w-20 h-20 rounded-full object-cover" />
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-900 rounded-full p-1 shadow-sm border border-border-color">
              <div className="bg-primary w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-xs">7</div>
            </div>
          </div>
          <h2 className="text-lg font-bold mb-1 text-slate-900 dark:text-white">Good Morning, {user?.displayName || 'Rajesh'}</h2>
          <p className="text-sm text-slate-500 font-medium">Data Strategy Division</p>
        </div>

        <div className="flex-1 p-6 space-y-8">
          {/* Competency Map in Sidebar */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">Competency Map</h3>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 flex flex-col items-center justify-center h-[280px]">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3">
                  <Loader2 className="animate-spin text-primary" size={24} />
                  <span className="text-[11px] font-medium">Analyzing...</span>
                </div>
              ) : (
                <>
                  <div className="flex-1 w-full min-h-0 relative -ml-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                        <PolarGrid stroke="#e2e8f0" strokeWidth={1} />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#444651', fontSize: 10, fontWeight: 500 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 5]} tick={false} axisLine={false} />
                        <Radar name="Benchmark" dataKey="benchmark" stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="4 4" fill="transparent" />
                        <Radar name="Current Level" dataKey="current" stroke="#5700db" strokeWidth={2} fill="#702dff" fillOpacity={0.25} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-col gap-1 mt-2 text-[10px] font-semibold text-slate-500 w-full px-2">
                    <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-primary/25 border-2 border-primary rounded-full"></div> Current Score</div>
                    <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 border-2 border-dashed border-slate-400 rounded-full"></div> FRAC Benchmark</div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Follow Mentors */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">Top Mentors</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=64&q=80" alt="Mentor" className="w-10 h-10 rounded-full object-cover" />
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Dr. R. Sharma</h4>
                    <p className="text-xs text-slate-500 font-medium">Public Policy</p>
                  </div>
                </div>
                <button className="text-primary text-xs font-bold hover:bg-primary/10 px-3 py-1.5 rounded-full transition-colors">Follow</button>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=64&q=80" alt="Mentor" className="w-10 h-10 rounded-full object-cover" />
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white">M. Verma</h4>
                    <p className="text-xs text-slate-500 font-medium">AI Ethics</p>
                  </div>
                </div>
                <button className="text-primary text-xs font-bold hover:bg-primary/10 px-3 py-1.5 rounded-full transition-colors">Follow</button>
              </div>
            </div>
            <button className="w-full mt-6 py-2.5 border-2 border-border-color rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              See All Mentors
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}
