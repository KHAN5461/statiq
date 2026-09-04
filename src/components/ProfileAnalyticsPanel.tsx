import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Loader2, Activity, Award, Calendar, BarChart2 } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip as RechartsTooltip, PieChart, Pie, Cell } from 'recharts';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../lib/AuthContext';
import { fetchUserTelemetryProgress, iGOTCourseProgress } from '../lib/api/igotSync';
import { useTheme } from '../lib/ThemeContext';

interface Competency {
  subject: string;
  current: number;
  benchmark: number;
  delta?: number;
}

interface ProfileAnalyticsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProfileAnalyticsPanel({ isOpen, onClose }: ProfileAnalyticsPanelProps) {
  const { user, role, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  
  const isAdmin = role === 'admin';
  
  const [radarData, setRadarData] = useState<Competency[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [courseProgress, setCourseProgress] = useState<Record<string, iGOTCourseProgress>>({});
  const [isSyncingProgress, setIsSyncingProgress] = useState(false);
  const [assessmentsCompleted, setAssessmentsCompleted] = useState(0);

  const isDark = theme === 'dark';

  // Mock data for new analytics
  const learningStreak = 5;
  const globalRank = 243;

  useEffect(() => {
    if (!isOpen) return;

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

      let completedCount = 0;

      try {
        if (user) {
          const q = query(
            collection(db, 'results'),
            where('userId', '==', user.uid)
          );
          const snap = await getDocs(q);
          completedCount = snap.docs.length;
          
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

      setAssessmentsCompleted(completedCount);

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
  }, [user, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    if (radarData.length > 0 && Object.keys(courseProgress).length === 0 && !isSyncingProgress) {
      const currentGaps = radarData.filter(d => (d.delta || 0) > 0);
      const autoSync = async () => {
        setIsSyncingProgress(true);
        try {
          const courseIds = currentGaps
            .map(gap => {
              const registry: Record<string, string> = {
                'Sampling': 'igot-mospi-sam-402',
                'Accounts': 'igot-mospi-acc-101',
                'Indices': 'igot-mospi-ind-305',
                'Python/R': 'igot-mospi-py-202',
                'GIS': 'igot-mospi-gis-501',
                'Governance': 'igot-mospi-gov-108',
                'Quality': 'igot-mospi-qua-204',
                'Field Ops': 'igot-mospi-fld-102',
              };
              return registry[gap.subject];
            })
            .filter((id): id is string => !!id);

          if (courseIds.length > 0) {
            const userId = user?.email || user?.uid || 'anonymous-officer';
            const progressMap = await fetchUserTelemetryProgress(userId, courseIds);
            setCourseProgress(progressMap);
          }
        } catch (error) {
          console.error("Auto sync progress failed:", error);
        } finally {
          setIsSyncingProgress(false);
        }
      };
      autoSync();
    }
  }, [radarData, isOpen, user]);

  const progressValues = Object.values(courseProgress) as iGOTCourseProgress[];
  const avgProgress = progressValues.length > 0 
    ? Math.round(progressValues.reduce((sum: number, item) => sum + item.completionPercentage, 0) / progressValues.length)
    : 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 z-50 w-full sm:w-[400px] bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col h-full overflow-hidden"
          >
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900 z-10">
              <div className="flex items-center gap-3">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="Profile" className="w-10 h-10 rounded-full object-cover shadow-sm border border-slate-200 dark:border-slate-700" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-900 dark:text-blue-200 font-bold border border-blue-200 dark:border-blue-800">
                    {user?.email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100">{user?.displayName || 'MoSPI Officer'}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{user?.email}</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors active:scale-95"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Mini Analytics Row */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 flex flex-col items-center justify-center text-center">
                  <Award size={18} className="text-amber-500 mb-1" />
                  <span className="text-lg font-black text-slate-900 dark:text-slate-100">#{globalRank}</span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Zone Rank</span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 flex flex-col items-center justify-center text-center">
                  <Calendar size={18} className="text-emerald-500 mb-1" />
                  <span className="text-lg font-black text-slate-900 dark:text-slate-100">{learningStreak}d</span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Streak</span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 flex flex-col items-center justify-center text-center">
                  <BarChart2 size={18} className="text-blue-500 mb-1" />
                  <span className="text-lg font-black text-slate-900 dark:text-slate-100">{assessmentsCompleted}</span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Quizzes</span>
                </div>
              </div>

              {/* Radar Chart */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col items-center justify-center h-[350px] shadow-sm relative">
                <h4 className="absolute top-4 left-4 text-xs font-bold text-slate-400 uppercase tracking-widest">FRAC Matrix</h4>
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
                          <RechartsTooltip 
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 600 }}
                            itemStyle={{ padding: 0 }}
                          />
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

              {/* Course Progress Summary Card */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col shadow-sm relative">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 w-full text-left">iGOT Progress</h4>
                {progressValues.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-[120px] text-center text-slate-400 gap-2">
                    <Activity size={24} className="text-slate-300 dark:text-slate-700" />
                    <span className="text-xs font-bold uppercase tracking-widest">No Active Sync</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center w-full">
                    <div className="w-full h-[150px] relative flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Completed', value: avgProgress },
                              { name: 'Remaining', value: 100 - avgProgress }
                            ]}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={65}
                            startAngle={90}
                            endAngle={-270}
                            dataKey="value"
                          >
                            <Cell key="cell-0" fill={isDark ? '#818CF8' : '#1e3a8a'} />
                            <Cell key="cell-1" fill={isDark ? '#1e293b' : '#f1f5f9'} />
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-2xl font-black text-slate-900 dark:text-slate-100">{avgProgress}%</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Admin Specific Analytics */}
              {isAdmin && (
                <div className="bg-indigo-50 dark:bg-indigo-950/30 rounded-xl border border-indigo-100 dark:border-indigo-900/50 p-5 flex flex-col shadow-sm">
                  <h4 className="text-xs font-bold text-indigo-900 dark:text-indigo-300 uppercase tracking-widest mb-4">Admin Insights</h4>
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="bg-white dark:bg-slate-900 rounded-lg p-3 border border-indigo-50 dark:border-indigo-900/40 shadow-sm">
                      <span className="text-lg font-black text-indigo-700 dark:text-indigo-400">1,284</span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mt-1">Active Learners</span>
                    </div>
                    <div className="bg-white dark:bg-slate-900 rounded-lg p-3 border border-indigo-50 dark:border-indigo-900/40 shadow-sm">
                      <span className="text-lg font-black text-indigo-700 dark:text-indigo-400">84%</span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mt-1">Avg FRAC Score</span>
                    </div>
                    <div className="bg-white dark:bg-slate-900 rounded-lg p-3 border border-indigo-50 dark:border-indigo-900/40 col-span-2 flex items-center justify-between shadow-sm">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Platform Sync Health</span>
                      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full text-[10px] font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        Optimal
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 shrink-0">
              <button 
                onClick={logout}
                className="w-full py-2.5 bg-white dark:bg-slate-900 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 border border-slate-200 dark:border-slate-800 hover:border-red-200 dark:hover:border-red-900/50 rounded-lg text-sm font-bold transition-all shadow-sm"
              >
                Sign Out
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
