import React, { useState, useEffect } from 'react';
import { ViewState } from '../types';
import { PlayCircle, ChevronLeft, ChevronRight, Play, AlertCircle, Clock, Target, Loader2, ArrowUpRight, TrendingUp, Activity } from 'lucide-react';
import { M3EmptyState } from './M3EmptyState';
import { motion } from 'motion/react';
import { collection, query, orderBy, limit, getDocs, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../lib/AuthContext';
import { generateiGOTDeepLink } from '../lib/api/igotSync';
import { IGOTRecommenderCard, SkillGap } from './iGOTRecommender';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { Material3Layout } from './Material3Layout';
import { LearnerAssessmentTab } from './LearnerAssessmentHub';

interface Competency {
  subject: string;
  current: number;
  benchmark: number;
  delta?: number;
}

import { useNavigate, useLocation } from 'react-router-dom';

export function LearnerView() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const activeTab = location.pathname.includes('/assessments')
    ? 'assessments' 
    : location.pathname.includes('/workshops')
    ? 'workshops' 
    : location.pathname.includes('/profile')
    ? 'profile' 
    : 'overview';

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
      const axesList = [
        { subject: 'Sampling', benchmark: 5 },
        { subject: 'Accounts', benchmark: 5 },
        { subject: 'Indices', benchmark: 5 },
        { subject: 'Python/R', benchmark: 4 },
        { subject: 'GIS', benchmark: 4 },
        { subject: 'Governance', benchmark: 5 },
        { subject: 'Quality', benchmark: 5 },
        { subject: 'Field Ops', benchmark: 4 },
      ];

      const scoresMap: Record<string, { total: number; count: number }> = {};
      axesList.forEach(a => { scoresMap[a.subject] = { total: 0, count: 0 }; });

      try {
        if (user) {
          const q = query(
            collection(db, 'results'),
            where('userId', '==', user.uid)
          );
          const snap = await getDocs(q);
          snap.docs.forEach(docSnap => {
            const data = docSnap.data();
            const tag = data.topic_tag || data.competencyAxis || 'Sampling';
            const pct = (data.score && data.maxScore) ? (data.score / data.maxScore) : 0.8;
            if (scoresMap[tag]) {
              scoresMap[tag].total += pct * 5;
              scoresMap[tag].count += 1;
            } else {
              scoresMap['Sampling'].total += pct * 5;
              scoresMap['Sampling'].count += 1;
            }
          });
        }
      } catch (e) {
        console.error("Failed to fetch database results", e);
      }

      const rawData = axesList.map(item => {
        const entry = scoresMap[item.subject];
        const calcCurrent = entry && entry.count > 0 ? Math.round(entry.total / entry.count) : 0;
        return {
          subject: item.subject,
          current: calcCurrent,
          benchmark: item.benchmark,
          delta: item.benchmark - calcCurrent
        };
      });
      
      setRadarData(rawData);
      setIsLoading(false);
    };
    fetchCompetencyData();
  }, [user]);

  const skillGaps = radarData.filter(d => (d.delta || 0) > 0);

  return (
    <Material3Layout title="Learner Dashboard" subtitle="Track your institutional competency stats and bridge critical upskilling gaps.">
      <div className="flex-1 flex flex-col w-full bg-background font-sans min-h-full">

        {activeTab === 'assessments' ? (
          <LearnerAssessmentTab 
            customAssessments={customAssessments}
            onStartQuiz={(id, assessmentObj) => {
              if (assessmentObj) {
                localStorage.setItem('active_assessment_id', assessmentObj.id);
              } else {
                localStorage.setItem('active_assessment_id', id);
              }
              localStorage.removeItem('temp_draft_questions');
              navigate('/assessment');
            }}
          />
        ) : activeTab === 'overview' ? (
          <div className="flex-1 flex flex-col xl:flex-row w-full bg-background">
      {/* Main Content Area */}
      <div className="flex-1 p-6 md:p-10 lg:p-12 pt-8 space-y-10 max-w-[1200px] mx-auto w-full">
        
        {/* Hero Banner */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-gradient-to-r from-blue-900 to-indigo-900 rounded-xl p-8 md:p-10 flex flex-col md:flex-row items-center justify-between shadow-md text-white relative overflow-hidden gap-8 border border-white/10"
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
                onClick={() => navigate('/assessment')}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-md text-sm font-bold flex items-center gap-2 transition-all shadow-md hover:shadow-lg active:scale-95 cursor-pointer focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
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
              <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
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
                  <div key={i} className="bg-surface rounded-xl p-6 border border-slate-200 dark:border-slate-800 h-48 animate-pulse flex items-center justify-center">
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
                    className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 flex flex-col hover:border-blue-900 dark:hover:border-blue-200 transition-all group shadow-sm hover:shadow-md"
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
                      className="mt-auto w-full py-3 bg-blue-50 dark:bg-blue-900/50 text-blue-900 dark:text-blue-100 rounded-md text-sm font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity text-center focus:ring-2 focus:ring-blue-900 focus:outline-none"
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
                <div className="flex items-center gap-2 text-slate-400 font-bold text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl">
                  <Loader2 className="animate-spin text-blue-900" size={16}/>
                  Loading custom assessments...
                </div>
              ) : customAssessments.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-xl text-center text-slate-400 text-xs">
                  No custom assessments currently assigned to your cohort.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {customAssessments.map(assessment => (
                    <div 
                      key={assessment.id}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-col justify-between hover:border-blue-900 dark:hover:border-blue-200 transition-all group shadow-sm hover:shadow-md"
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
                        className="w-full py-3 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/50 dark:hover:bg-blue-800/50 text-blue-900 dark:text-blue-100 rounded-md text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer focus:ring-2 focus:ring-blue-900 focus:outline-none"
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
      <aside className="w-full xl:w-96 shrink-0 bg-slate-50 dark:bg-slate-900 border-t xl:border-t-0 xl:border-l border-slate-200 dark:border-slate-800 flex flex-col z-10 xl:sticky xl:top-0 xl:h-[calc(100vh-64px)] overflow-y-auto">
        
        <div className="p-8 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 sticky top-0 z-20">
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 mb-1 tracking-tight">FRAC Profile</h2>
          <p className="text-sm font-medium text-slate-500">8-Axis Structural Competency</p>
        </div>

        <div className="flex-1 p-8 space-y-8">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col items-center justify-center h-[350px] shadow-sm relative">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3">
                <Loader2 className="animate-spin text-blue-900" size={24} />
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
                      <Radar name="Current Level" dataKey="current" stroke="#1E3A8A" strokeWidth={2.5} fill="#1E3A8A" fillOpacity={0.2} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-6 mt-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest w-full">
                  <div className="flex items-center gap-2"><div className="w-3 h-3 bg-blue-900/20 border-2 border-blue-900 rounded-sm"></div> Current</div>
                  <div className="flex items-center gap-2"><div className="w-3 h-3 border-2 border-dashed border-slate-300 rounded-sm"></div> Baseline</div>
                </div>
              </>
            )}
          </div>

          <div className="mt-8">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-widest mb-4">Upcoming Speed Drills</h3>
            <div className="bg-white dark:bg-[#2B2930] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">Sampling Optimization</div>
                <span className="text-[10px] font-extrabold bg-blue-50 dark:bg-blue-900/50 text-blue-900 dark:text-blue-100 px-2.5 py-1 rounded-full uppercase tracking-wider border border-transparent">Tomorrow</span>
              </div>
              <p className="text-xs font-medium text-slate-500 mb-4">Proctored evaluation for JSO cadre.</p>
              <button onClick={() => setCurrentView('assessment')} className="w-full bg-[#E8DEF8] hover:bg-blue-50 dark:bg-[#4A4458] dark:hover:bg-[#381E72] text-[#1D192B] dark:text-blue-100 py-2.5 rounded-full text-xs font-bold transition-colors cursor-pointer focus:ring-2 focus:ring-primary focus:outline-none">
                View Details
              </button>
            </div>
          </div>
        </div>
      </aside>
    </div>
        ) : activeTab === 'workshops' ? (
          /* TPAC Workshop Nominations Roster View */
          <div className="flex-1 p-6 md:p-10 max-w-[1200px] mx-auto w-full space-y-8">
            <div className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <span className="px-3 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 text-[10px] font-extrabold uppercase tracking-widest rounded-full border border-amber-200">
                    NSSTA Greater Noida Roster
                  </span>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight mt-2">
                    TPAC Workshop Nominations & Training Roster
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Official residential workshop nominations generated by the MoSPI Cadre Controller.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                <div className="bg-slate-50 dark:bg-slate-950 p-6 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-blue-900 uppercase tracking-widest">Active Nomination</span>
                    <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full">APPROVED</span>
                  </div>
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
                    Advanced Stratified Sampling & Data Anonymization
                  </h3>
                  <div className="text-xs text-slate-500 space-y-1 font-medium">
                    <p><strong>Campus:</strong> NSSTA Campus, Greater Noida, UP</p>
                    <p><strong>Duration:</strong> October 14 - October 18, 2026</p>
                    <p><strong>Target Cadre:</strong> Senior Statistical Officers (SSO)</p>
                  </div>
                  <button className="w-full py-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded-full font-bold text-xs shadow-sm transition-colors cursor-pointer">
                    Download Joining Instructions & Gate Pass
                  </button>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950 p-6 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Recommended TNA</span>
                    <span className="px-2.5 py-0.5 bg-amber-50 text-amber-700 text-xs font-bold rounded-full">RECOMMENDED</span>
                  </div>
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
                    National Accounts & GVA Estimation Methods
                  </h3>
                  <div className="text-xs text-slate-500 space-y-1 font-medium">
                    <p><strong>Campus:</strong> NASA Regional Training Centre, Hyderabad</p>
                    <p><strong>Duration:</strong> November 02 - November 06, 2026</p>
                    <p><strong>Status:</strong> Pending Cadre Approval</p>
                  </div>
                  <button className="w-full py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-full font-bold text-xs hover:bg-slate-100 transition-colors cursor-pointer">
                    Request Nomination
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Profile & Settings View */
          <div className="flex-1 p-6 md:p-10 max-w-[1200px] mx-auto w-full space-y-8">
            <div className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-8">
              
              <div className="flex items-center gap-6 border-b border-slate-100 dark:border-slate-800 pb-6">
                <div className="w-20 h-20 rounded-xl bg-blue-50 text-blue-900 font-black text-2xl flex items-center justify-center border-2 border-blue-900">
                  AS
                </div>
                <div>
                  <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-extrabold uppercase tracking-widest rounded-full">
                    Senior Statistical Officer (SSO)
                  </span>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">Dr. Aisha Sharma</h2>
                  <p className="text-xs text-slate-500 font-medium">
                    Cadre Reg: ISS-2024-8821 • MoSPI NSSO Field Operations Division (Northern Zone)
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-widest">
                    Personnel & Cadre Credentials
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-bold text-slate-500 block mb-1">Official Email</label>
                      <input 
                        type="text" 
                        readOnly 
                        value={user?.email || "aisha.sharma@mospi.gov.in"} 
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 block mb-1">Assigned Zone</label>
                      <input 
                        type="text" 
                        readOnly 
                        value="Northern Zone (New Delhi FOD Headquarter)" 
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-widest">
                    iGOT Karmayogi Sync & AI Preferences
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-bold text-slate-500 block mb-1">iGOT User ID Token</label>
                      <input 
                        type="text" 
                        readOnly 
                        value="iGOT-KP-88219-M3" 
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3 rounded-xl text-xs font-mono text-emerald-700 dark:text-emerald-400 font-bold outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 block mb-1">Auto Sync Status</label>
                      <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/30 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center justify-between">
                        <span>Connected & Auto-Routing Active</span>
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"/>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
            
            <div className="mt-8 border-t border-slate-100 dark:border-slate-800 pt-8">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-widest mb-6">
                Recent Competency Activity
              </h3>
              <M3EmptyState 
                icon={Activity}
                badge="Activity Log"
                title="No Recent Diagnostics"
                subtitle="You haven't completed any competency diagnostics or workshops recently. Head to the overview to start an assessment."
                actionLabel="View Assigned Assessments"
                onAction={() => navigate('/learner/assessments')}
              />
            </div>

          </div>
        )}
      </div>
    </Material3Layout>
  );
}
