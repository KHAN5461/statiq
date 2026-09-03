import React, { useState, useEffect } from 'react';
import { ViewState } from '../types';
import { PlayCircle, ChevronLeft, ChevronRight, Play, AlertCircle, Clock, Target, Loader2, ArrowUpRight, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';
import { collection, query, orderBy, limit, getDocs, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../lib/AuthContext';
import { generateiGOTDeepLink } from '../lib/api/igotSync';
import { IGOTRecommenderCard, SkillGap } from './iGOTRecommender';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { Material3Layout } from './Material3Layout';

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
  
  const [customAssessments, setCustomAssessments] = useState<any[]>([]);
  const [loadingAssessments, setLoadingAssessments] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'assessments'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCustomAssessments(fetched);
      setLoadingAssessments(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchCompetencyData = async () => {
      const rawData = [
        { subject: 'Sampling', current: 3, benchmark: 5 },
        { subject: 'Accounts', current: 5, benchmark: 5 },
        { subject: 'Indices', current: 4, benchmark: 5 },
        { subject: 'Python/R', current: 2, benchmark: 4 },
        { subject: 'GIS', current: 3, benchmark: 4 },
        { subject: 'Governance', current: 5, benchmark: 5 },
        { subject: 'Quality', current: 4, benchmark: 5 },
        { subject: 'Field Ops', current: 3, benchmark: 4 },
      ];
      
      try {
        if (user) {
          const q = query(
            collection(db, 'results'),
            where('userId', '==', user.uid)
          );
          const snap = await getDocs(q);
          if (!snap.empty) {
            // Sort in memory by submittedAt desc
            const sortedDocs = [...snap.docs].sort((a, b) => {
              const aTime = a.data().submittedAt?.seconds || 0;
              const bTime = b.data().submittedAt?.seconds || 0;
              return bTime - aTime;
            });
            const latestResult = sortedDocs[0].data();
            // Update Sampling score with the ratio mapped to a 5-point scale
            const ratio = latestResult.score / latestResult.maxScore;
            rawData[0].current = Math.round(ratio * 5);
          }
        }
      } catch (e) {
        console.error("Failed to fetch results", e);
      }

      const enrichedData = rawData.map(item => ({
        ...item,
        delta: item.benchmark - item.current
      }));
      
      setRadarData(enrichedData);
      setIsLoading(false);
    };
    fetchCompetencyData();
  }, [user]);

  const skillGaps = radarData.filter(d => (d.delta || 0) > 0);

  return (
    <Material3Layout title="Learner Dashboard" subtitle="Track your institutional competency stats and bridge critical upskilling gaps.">
      <div className="flex-1 flex flex-col xl:flex-row w-full bg-background font-sans min-h-full">
      {/* Main Content Area */}
      <div className="flex-1 p-6 md:p-10 lg:p-12 pt-8 space-y-10 max-w-[1200px] mx-auto w-full">
        
        {/* Hero Banner */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-gradient-to-r from-[#21005D] to-[#4F378B] dark:from-[#2B2930] dark:to-[#4F378B] rounded-2xl p-8 md:p-10 flex flex-col md:flex-row items-center justify-between shadow-md text-white relative overflow-hidden gap-8 border border-[#E7E0EC]/10"
        >
          {/* Subtle Abstract Background Elements */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3"></div>
          
          <div className="relative z-10 max-w-xl">
            <span className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 border border-white/20 rounded-full text-[10px] font-extrabold uppercase tracking-widest mb-6 backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
              iGOT Integration Active
            </span>
            <h2 className="text-3xl md:text-5xl font-extrabold mb-4 leading-[1.1] tracking-tight text-white">
              Bridge your competency gaps.
            </h2>
            <p className="text-blue-100 font-medium text-sm md:text-base mb-8 max-w-md">
              Your FRAC profile indicates required upskilling in <span className="text-white font-bold">Sampling Tech</span> and <span className="text-white font-bold">Python/R</span>.
            </p>
            <div className="flex flex-wrap gap-4">
              <button 
                onClick={() => setCurrentView('assessment')}
                className="bg-secondary hover:bg-orange-700 text-white px-6 py-3 rounded-full text-sm font-bold flex items-center gap-2 transition-all shadow-md hover:shadow-lg active:scale-95 cursor-pointer focus:ring-2 focus:ring-offset-2 focus:ring-secondary"
              >
                Start Diagnostic Test
                <PlayCircle size={18} />
              </button>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Delta Gap Interventions */}
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-2 space-y-8">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">iGOT Deep-Link Recommendations</h3>
                <p className="text-sm font-medium text-slate-500 mt-1">Modules mapped directly to your FRAC skill gaps.</p>
              </div>
            </div>

            {/* Render the newly requested iGOTRecommenderCard component */}
            {!isLoading && (
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-[#E7E0EC] dark:border-[#49454F]/50 shadow-sm">
                {(() => {
                  const recommenderGaps: SkillGap[] = skillGaps.map(gap => ({
                    axis: gap.subject,
                    delta: gap.delta || 0,
                    evaluatedScore: gap.current,
                    targetScore: gap.benchmark
                  }));
                  return <IGOTRecommenderCard gaps={recommenderGaps} />;
                })()}
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {isLoading ? (
                [1,2,3].map(i => (
                  <div key={i} className="bg-surface rounded-2xl p-6 border border-[#E7E0EC] dark:border-[#49454F]/50 h-48 animate-pulse flex items-center justify-center">
                    <Loader2 className="animate-spin text-slate-300" size={24}/>
                  </div>
                ))
              ) : (
                skillGaps.map((gap, index) => (
                  <motion.div 
                    key={gap.subject}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 * index }}
                    className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-[#E7E0EC] dark:border-[#49454F]/50 flex flex-col hover:border-[#6750A4] dark:hover:border-[#D0BCFF] transition-all group shadow-sm hover:shadow-md"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-950/20 text-red-600 flex items-center justify-center border border-red-100 dark:border-red-900/30">
                        <TrendingUp size={20} strokeWidth={2.5}/>
                      </div>
                      <span className="px-2.5 py-1 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 text-[10px] font-bold tracking-widest rounded-full uppercase border border-red-200 dark:border-red-900/30">
                        -{gap.delta} Lvl Gap
                      </span>
                    </div>
                    <h4 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 mb-1">{gap.subject}</h4>
                    <p className="text-xs font-medium text-slate-500 mb-6">Target: Level {gap.benchmark} • Current: Level {gap.current}</p>
                    <a 
                      href={generateiGOTDeepLink(gap.subject)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-auto w-full py-3 bg-[#EADDFF] dark:bg-[#381E72] text-[#21005D] dark:text-[#EADDFF] rounded-full text-sm font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity text-center focus:ring-2 focus:ring-primary focus:outline-none"
                    >
                      Launch iGOT Module <ArrowUpRight size={16}/>
                    </a>
                  </motion.div>
                ))
              )}
            </div>

            {/* Available Custom Competency Assessments */}
            <div className="pt-6">
              <h3 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight mb-2">Available Custom Competency Assessments</h3>
              <p className="text-sm font-medium text-slate-500 mb-6">Take real-time dynamic evaluations generated by the MoSPI Admin team.</p>
              
              {loadingAssessments ? (
                <div className="flex items-center gap-2 text-slate-400 font-bold text-sm bg-white dark:bg-slate-900 border border-[#E7E0EC] dark:border-[#49454F]/50 p-6 rounded-2xl">
                  <Loader2 className="animate-spin text-[#6750A4]" size={16}/>
                  Loading custom assessments...
                </div>
              ) : customAssessments.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 border border-[#E7E0EC] dark:border-[#49454F]/50 p-8 rounded-2xl text-center text-slate-400 text-xs">
                  No custom assessments currently assigned to your cohort.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {customAssessments.map(assessment => (
                    <div 
                      key={assessment.id}
                      className="bg-white dark:bg-slate-900 border border-[#E7E0EC] dark:border-[#49454F]/50 rounded-2xl p-6 flex flex-col justify-between hover:border-[#6750A4] dark:hover:border-[#D0BCFF] transition-all group shadow-sm hover:shadow-md"
                    >
                      <div>
                        <div className="flex justify-between items-start mb-4">
                          <span className="px-2.5 py-1 bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 text-[10px] font-bold tracking-widest rounded-full uppercase border border-blue-200 dark:border-blue-900/30">
                            {assessment.cohort || 'All Cohorts'}
                          </span>
                          <span className="text-xs font-bold text-slate-400">
                            {(assessment.questions || []).length} MCQs
                          </span>
                        </div>
                        <h4 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 mb-2 leading-tight tracking-tight">{assessment.title}</h4>
                        <p className="text-xs font-medium text-slate-500 mb-6 line-clamp-2">
                          {assessment.description || 'Auto-generated dynamic MoSPI assessment.'}
                        </p>
                      </div>
                      <button 
                        onClick={() => {
                          localStorage.setItem('active_assessment_id', assessment.id);
                          localStorage.removeItem('temp_draft_questions');
                          setCurrentView('assessment');
                        }}
                        className="w-full py-3 bg-[#EADDFF] hover:bg-[#D0BCFF] dark:bg-[#381E72] dark:hover:bg-[#4F378B] text-[#21005D] dark:text-[#EADDFF] rounded-full text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer focus:ring-2 focus:ring-primary focus:outline-none"
                      >
                        Start Assessment <PlayCircle size={16}/>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.section>
        </div>
      </div>

      {/* Right Sidebar (Radar Chart) */}
      <aside className="w-full xl:w-96 shrink-0 bg-[#F7F2FA] dark:bg-[#1D1B20] border-t xl:border-t-0 xl:border-l border-[#E7E0EC] dark:border-[#49454F] flex flex-col z-10 xl:sticky xl:top-0 xl:h-[calc(100vh-64px)] overflow-y-auto">
        
        <div className="p-8 border-b border-[#E7E0EC] dark:border-[#49454F] bg-white dark:bg-slate-950 sticky top-0 z-20">
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 mb-1 tracking-tight">FRAC Profile</h2>
          <p className="text-sm font-medium text-slate-500">8-Axis Structural Competency</p>
        </div>

        <div className="flex-1 p-8 space-y-8">
          <div className="bg-white dark:bg-[#2B2930] rounded-2xl border border-[#E7E0EC] dark:border-[#49454F]/60 p-5 flex flex-col items-center justify-center h-[350px] shadow-sm relative">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3">
                <Loader2 className="animate-spin text-primary" size={24} />
              </div>
            ) : (
              <>
                <div className="flex-1 w-full min-h-0 relative -ml-2 mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="65%" data={radarData}>
                      <PolarGrid stroke="#e2e8f0" strokeWidth={1} />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 5]} tick={false} axisLine={false} />
                      <Radar name="Benchmark" dataKey="benchmark" stroke="#94a3b8" strokeWidth={2} strokeDasharray="4 4" fill="transparent" />
                      <Radar name="Current Level" dataKey="current" stroke="#6750A4" strokeWidth={2.5} fill="#6750A4" fillOpacity={0.2} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-6 mt-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest w-full">
                  <div className="flex items-center gap-2"><div className="w-3 h-3 bg-[#6750A4]/20 border-2 border-[#6750A4] rounded-sm"></div> Current</div>
                  <div className="flex items-center gap-2"><div className="w-3 h-3 border-2 border-dashed border-slate-300 rounded-sm"></div> Baseline</div>
                </div>
              </>
            )}
          </div>

          <div className="mt-8">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-widest mb-4">Upcoming Speed Drills</h3>
            <div className="bg-white dark:bg-[#2B2930] border border-[#E7E0EC] dark:border-[#49454F]/60 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">Sampling Optimization</div>
                <span className="text-[10px] font-extrabold bg-[#EADDFF] dark:bg-[#381E72] text-[#21005D] dark:text-[#EADDFF] px-2.5 py-1 rounded-full uppercase tracking-wider border border-transparent">Tomorrow</span>
              </div>
              <p className="text-xs font-medium text-slate-500 mb-4">Proctored evaluation for JSO cadre.</p>
              <button onClick={() => setCurrentView('assessment')} className="w-full bg-[#E8DEF8] hover:bg-[#EADDFF] dark:bg-[#4A4458] dark:hover:bg-[#381E72] text-[#1D192B] dark:text-[#EADDFF] py-2.5 rounded-full text-xs font-bold transition-colors cursor-pointer focus:ring-2 focus:ring-primary focus:outline-none">
                View Details
              </button>
            </div>
          </div>
        </div>
      </aside>
    </div>
    </Material3Layout>
  );
}
