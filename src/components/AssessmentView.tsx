import React, { useState, useEffect } from 'react';
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle2, 
  Trophy, 
  Flag, 
  Clock, 
  AlertCircle,
  HelpCircle,
  TrendingUp,
  RefreshCw,
  Search,
  BookOpen,
  Loader2
} from 'lucide-react';
import { ViewState } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { collection, query, orderBy, limit, getDocs, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { sendAssessmentTelemetry } from '../lib/api/igotSync';
import { M3EmptyState } from './M3EmptyState';
import { useNavigate, useParams } from 'react-router-dom';

interface AssessmentViewProps {
  activeAssessment?: any;
}
const QUESTIONS = [
  {
    id: 1,
    text: "According to the NSSO manual, which of the following sampling frames is generally used for the first-stage selection of villages in a rural stratum?",
    options: [
      { id: 'a', text: "Population Census villages", label: 'A', keybind: '1' },
      { id: 'b', text: "Economic Census blocks", label: 'B', keybind: '2' },
      { id: 'c', text: "Urban Frame Survey blocks", label: 'C', keybind: '3' },
      { id: 'd', text: "Voter registration lists", label: 'D', keybind: '4' }
    ],
    correct: 'a',
    rationale: "NSSO primarily uses Population Census villages as the First Stage Units (FSUs) in rural areas to ensure comprehensive demographic representation."
  },
  {
    id: 2,
    text: "If a selected FSU has a population exceeding 1200, what is the standard procedure to manage the workload?",
    options: [
      { id: 'a', text: "Survey the entire FSU", label: 'A', keybind: '1' },
      { id: 'b', text: "Divide the FSU into smaller hamlet-groups", label: 'B', keybind: '2' },
      { id: 'c', text: "Select an alternative FSU", label: 'C', keybind: '3' },
      { id: 'd', text: "Only survey households with >5 members", label: 'D', keybind: '4' }
    ],
    correct: 'b',
    rationale: "Whenever the population of a sample FSU exceeds 1200, it is to be divided into a suitable number of hamlet-groups to restrict the listing workload."
  },
  {
    id: 3,
    text: "For estimating the GVA in the unorganized sector, which multiplier technique is predominantly used by the MoSPI?",
    options: [
      { id: 'a', text: "Labor Input Method (LIM)", label: 'A', keybind: '1' },
      { id: 'b', text: "Expenditure Tracking", label: 'B', keybind: '2' },
      { id: 'c', text: "Capital Formation Ratios", label: 'C', keybind: '3' },
      { id: 'd', text: "Export-Import Balances", label: 'D', keybind: '4' }
    ],
    correct: 'a',
    rationale: "The Labor Input Method (LIM) applies value-added per worker metrics from enterprise surveys to total workforce estimates to calculate unorganized GVA."
  },
  {
    id: 4,
    text: "In the context of index numbers, what weighting diagram is utilized for compiling the CPI (Rural/Urban/Combined)?",
    options: [
      { id: 'a', text: "Wholesale Price averages", label: 'A', keybind: '1' },
      { id: 'b', text: "Consumer Expenditure Survey (CES) data", label: 'B', keybind: '2' },
      { id: 'c', text: "Gross Domestic Product deflator", label: 'C', keybind: '3' },
      { id: 'd', text: "Industrial Production outputs", label: 'D', keybind: '4' }
    ],
    correct: 'b',
    rationale: "CPI weighting diagrams are constructed directly from the consumption patterns revealed in the Consumer Expenditure Survey (CES)."
  },
  {
    id: 5,
    text: "Under the DPDP Act guidelines for field enumerators, what must be done with PII (Personally Identifiable Information) after data entry?",
    options: [
      { id: 'a', text: "Retain locally for 5 years", label: 'A', keybind: '1' },
      { id: 'b', text: "Anonymize and destroy physical copies within 30 days", label: 'B', keybind: '2' },
      { id: 'c', text: "Upload to an unsecured cloud storage", label: 'C', keybind: '3' },
      { id: 'd', text: "Share with third-party verification agencies", label: 'D', keybind: '4' }
    ],
    correct: 'b',
    rationale: "Field enumerators must anonymize PII during the digitization phase and securely destroy raw physical schedules within 30 days to comply with DPDP data minimization principles."
  }
];

function MarkdownTableRenderer({ markdown }: { markdown: string }) {
  if (!markdown) return null;
  const lines = markdown.trim().split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return null;
  
  // Extract headers
  const headerLine = lines[0];
  const headers = headerLine.split('|').map(h => h.trim()).filter((_, idx) => idx > 0 && idx < headerLine.split('|').length - 1);
  
  // Extract rows, skipping the separator line
  const rows = lines.slice(2).map(line => {
    return line.split('|').map(cell => cell.trim()).filter((_, idx) => idx > 0 && idx < line.split('|').length - 1);
  });
  
  return (
    <div className="mb-6 overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-xl shadow-inner bg-slate-50 dark:bg-slate-900 p-4">
      <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700 text-xs text-left">
        <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold uppercase tracking-wider">
          <tr>
            {headers.map((h, i) => (
              <th key={i} className="px-4 py-2 border-b border-slate-200 dark:border-slate-700">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200 font-medium">
          {rows.map((row, rowIdx) => (
            <tr key={rowIdx} className="hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors">
              {row.map((cell, cellIdx) => (
                <td key={cellIdx} className="px-4 py-2 whitespace-nowrap">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function AssessmentView({ activeAssessment }: AssessmentViewProps) {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [questions, setQuestions] = useState<any[]>([]);
  const [loadingDb, setLoadingDb] = useState(true);

  useEffect(() => {
    const fetchAssessment = async () => {
      try {
        if (activeAssessment && activeAssessment.questions && activeAssessment.questions.length > 0) {
          const formatted = activeAssessment.questions.map((rq: any, idx: number) => ({
            id: rq.id || (idx + 1),
            text: rq.text || rq.question_text || rq.prompt,
            options: (rq.options || []).map((optText: any, oIdx: number) => ({
              id: ['a','b','c','d'][oIdx % 4],
              text: typeof optText === 'string' ? optText : (optText?.text || String(optText)),
              label: ['A','B','C','D'][oIdx % 4],
              keybind: String(oIdx + 1)
            })),
            correct: typeof rq.correct === 'string' ? rq.correct : ['a','b','c','d'][(rq.correctIndex ?? rq.correct_option_index ?? 0) % 4],
            rationale: rq.explanation || rq.rationale || "",
            section_name: rq.section_name || (rq.topic_tag ? `${rq.topic_tag} Competency Module` : 'Assessment Questions'),
            section_type: rq.section_type || rq.type || (rq.data_table_markdown ? 'data_interpretation_caselet' : 'standard_mcq'),
            data_table_markdown: rq.data_table_markdown
          }));
          setQuestions(formatted);
          setLoadingDb(false);
          return;
        }

        const tempDraft = localStorage.getItem('temp_draft_questions');
        const activeId = localStorage.getItem('active_assessment_id');

        if (tempDraft) {
          const rawQ = JSON.parse(tempDraft);
          if (rawQ && rawQ.length > 0) {
            const formatted = rawQ.map((rq: any, idx: number) => ({
              id: rq.id || (idx + 1),
              text: rq.text || rq.question_text || rq.prompt,
              options: (rq.options || []).map((optText: string, oIdx: number) => ({
                id: ['a','b','c','d'][oIdx % 4],
                text: optText,
                label: ['A','B','C','D'][oIdx % 4],
                keybind: String(oIdx + 1)
              })),
              correct: ['a','b','c','d'][rq.correctIndex ?? rq.correct_option_index ?? 0],
              rationale: rq.explanation || rq.rationale || "",
              section_name: rq.section_name,
              section_type: rq.section_type || rq.type,
              data_table_markdown: rq.data_table_markdown
            }));
            setQuestions(formatted);
          }
          return;
        }

        if (activeId) {
          const docSnap = await getDoc(doc(db, 'assessments', activeId));
          if (docSnap.exists()) {
            const rawQ = docSnap.data().questions;
            if (rawQ && rawQ.length > 0) {
              const formatted = rawQ.map((rq: any, idx: number) => ({
                id: rq.id || (idx + 1),
                text: rq.text || rq.question_text || rq.prompt,
                options: (rq.options || []).map((optText: string, oIdx: number) => ({
                  id: ['a','b','c','d'][oIdx % 4],
                  text: optText,
                  label: ['A','B','C','D'][oIdx % 4],
                  keybind: String(oIdx + 1)
                })),
                correct: ['a','b','c','d'][rq.correctIndex ?? rq.correct_option_index ?? 0],
                rationale: rq.explanation || rq.rationale || "",
                section_name: rq.section_name,
                section_type: rq.section_type || rq.type,
                data_table_markdown: rq.data_table_markdown
              }));
              setQuestions(formatted);
            }
          }
          return;
        }

        const q = query(collection(db, 'assessments'), orderBy('createdAt', 'desc'), limit(1));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const docSnap = snap.docs[0];
          const rawQ = docSnap.data().questions;
          if (rawQ && rawQ.length > 0) {
            const formatted = rawQ.map((rq: any, idx: number) => ({
              id: rq.id || (idx + 1),
              text: rq.text || rq.question_text || rq.prompt,
              options: (rq.options || []).map((optText: string, oIdx: number) => ({
                id: ['a','b','c','d'][oIdx % 4],
                text: optText,
                label: ['A','B','C','D'][oIdx % 4],
                keybind: String(oIdx + 1)
              })),
              correct: ['a','b','c','d'][rq.correctIndex ?? rq.correct_option_index ?? 0],
              rationale: rq.explanation || rq.rationale || "",
              section_name: rq.section_name,
              section_type: rq.section_type || rq.type,
              data_table_markdown: rq.data_table_markdown
            }));
            setQuestions(formatted);
          }
        }
      } catch (e) {
        console.error("Failed to load assessment", e);
      } finally {
        setLoadingDb(false);
      }
    };
    fetchAssessment();
  }, []);


  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [flags, setFlags] = useState<Set<number>>(new Set());
  const [submitted, setSubmitted] = useState(false);
  // Dynamic timer: 2 min per question, clamped between 10 and 60 minutes
  const [timeLeft, setTimeLeft] = useState(() => {
    const mins = Math.min(60, Math.max(10, (questions.length || 5) * 2));
    return mins * 60;
  });
  const [isReRolling, setIsReRolling] = useState(false);
  
  useEffect(() => {
    if (submitted) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [submitted]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const q = questions[currentIdx];

  const handleSelect = (optionId: string) => {
    setAnswers(prev => ({ ...prev, [currentIdx]: optionId }));
  };

  const handleNext = () => {
    if (currentIdx < questions.length - 1) setCurrentIdx(currentIdx + 1);
  };

  const handlePrev = () => {
    if (currentIdx > 0) setCurrentIdx(currentIdx - 1);
  };

  const toggleFlag = () => {
    setFlags(prev => {
      const next = new Set(prev);
      if (next.has(currentIdx)) next.delete(currentIdx);
      else next.add(currentIdx);
      return next;
    });
  };

  // Keyboard navigation
  useEffect(() => {
    if (submitted) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.altKey || e.metaKey) return;
      
      const key = e.key.toUpperCase();
      const optionIndex = ['1', '2', '3', '4', 'A', 'B', 'C', 'D'].indexOf(key);
      
      if (optionIndex !== -1) {
        const normalizedIndex = optionIndex % 4;
        const option = q.options[normalizedIndex];
        if (option) handleSelect(option.id);
      } else if (key === 'ARROWLEFT') {
        handlePrev();
      } else if (key === 'ARROWRIGHT' || key === 'ENTER') {
        if (currentIdx < questions.length - 1) {
           handleNext();
        } else if (key === 'ENTER') {
           handleSubmit();
        }
      } else if (key === 'F') {
        toggleFlag();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIdx, q, submitted]);

  const handleSubmit = async () => {
    if (Object.keys(answers).length < questions.length) {
      if (!window.confirm("You have unanswered questions. Are you sure you want to submit?")) return;
    }
    
    // Calculate score
    const finalScore = Object.keys(answers).reduce((acc, qId) => {
      const question = questions[Number(qId)];
      return acc + (answers[Number(qId)] === question.correct ? 1 : 0);
    }, 0);
    
    try {
      await addDoc(collection(db, 'results'), {
        userId: auth.currentUser?.uid || 'anonymous',
        assessmentId: 'latest', // or actual ID if we store it
        score: finalScore,
        maxScore: questions.length,
        delta: questions.length - finalScore,
        submittedAt: serverTimestamp()
      });

      // Construct and send telemetry payload to iGOT Karmayogi
      const userId = auth.currentUser?.uid || 'anonymous_officer';
      const telemetryScores = questions.map((question, idx) => {
        const isCorrect = answers[idx] === question.correct;
        
        let axis = 'Sampling';
        let target = 4;
        
        if (idx === 1) { axis = 'Field Ops'; target = 4; }
        else if (idx === 2) { axis = 'Accounts'; target = 3; }
        else if (idx === 3) { axis = 'Indices'; target = 4; }
        else if (idx === 4) { axis = 'Governance'; target = 3; }
        else if (question.topic_tag) {
          axis = question.topic_tag;
          target = 4;
        }

        const evaluated = isCorrect ? 5 : Math.max(1, target - 2);
        const delta = Math.max(0, target - evaluated);

        return {
          axis,
          evaluated_score: evaluated,
          target_baseline: target,
          delta
        };
      });

      console.log('Sending outbound iGOT telemetry...', telemetryScores);
      await sendAssessmentTelemetry(userId, 'latest_frac_diagnostic', telemetryScores);

    } catch(e) {
      console.error("Failed to save result or sync iGOT telemetry", e);
    }
    setSubmitted(true);
  };

  const score = Object.keys(answers).reduce((acc, qId) => {
    const question = questions[Number(qId)];
    return acc + (answers[Number(qId)] === question.correct ? 1 : 0);
  }, 0);
  
  const percentage = Math.round((score / questions.length) * 100);
  const circumference = 2 * Math.PI * 46;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const handleReRoll = () => {
    setIsReRolling(true);
    setTimeout(() => {
      // Simulate generating new questions
      alert("AI has generated a 3-question micro-quiz targeting your failed concepts. This would navigate to a new quiz session.");
      setIsReRolling(false);
    }, 2000);
  };

  if (submitted) {
    const incorrectQuestions = QUESTIONS.filter((q, idx) => answers[idx] !== q.correct);

    return (
      <div className="min-h-screen bg-background flex flex-col p-4 sm:p-8 overflow-y-auto">
        <div className="max-w-5xl mx-auto w-full flex flex-col gap-8">
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-900 rounded-xl p-8 md:p-10 border border-slate-200 dark:border-slate-800 shadow-md flex flex-col items-center text-center relative overflow-hidden"
          >
            <button onClick={() => navigate('/learner')} className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors focus:ring-2 focus:ring-primary focus:outline-none">
              <X size={24} />
            </button>

            <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 shadow-inner ${percentage >= 80 ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50' : 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border border-amber-200/50'}`}>
              <Trophy size={40} />
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-slate-100 mb-2 tracking-tight">Assessment Complete</h1>
            <p className="text-base md:text-lg text-slate-500 dark:text-slate-400 mb-10 font-medium">Advanced Statistical Methods (Module 3)</p>
            
            <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12 w-full justify-center bg-[#F7F2FA] dark:bg-[#1D1B20] p-8 rounded-xl border border-slate-200 dark:border-slate-800">
               <div className="relative w-32 h-32 shrink-0">
                 <svg className="w-full h-full transform -rotate-90 filter drop-shadow-sm">
                   <circle cx="64" cy="64" r="46" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-200 dark:text-slate-800" />
                   <motion.circle 
                     cx="64" cy="64" r="46" 
                     stroke="currentColor" 
                     strokeWidth="12" 
                     fill="transparent" 
                     strokeDasharray={circumference}
                     initial={{ strokeDashoffset: circumference }}
                     animate={{ strokeDashoffset }}
                     transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
                     className={percentage >= 80 ? 'text-emerald-500' : 'text-amber-500'} 
                     strokeLinecap="round"
                   />
                 </svg>
                 <div className="absolute inset-0 flex items-center justify-center flex-col">
                   <span className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">{percentage}%</span>
                 </div>
               </div>
               
               <div className="flex flex-col gap-5 text-center md:text-left">
                 <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Total Score</h4>
                    <p className="text-2xl font-extrabold text-slate-800 dark:text-slate-200">{score} <span className="text-slate-400 text-lg font-bold">out of</span> {questions.length} <span className="text-slate-400 text-lg font-bold">correct</span></p>
                 </div>
                 <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Status</h4>
                    <p className={`text-sm font-bold px-4 py-2 rounded-full inline-flex shadow-sm border ${percentage >= 80 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                      {percentage >= 80 ? 'Proficiency Demonstrated' : 'Further Review Recommended'}
                    </p>
                 </div>
               </div>
            </div>
          </motion.div>

          {/* Diagnostic & Skill Intelligence Drawer */}
          {incorrectQuestions.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-md p-8"
            >
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <h3 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Search className="text-blue-900 dark:text-blue-200"/> Diagnostic Breakdown
                  </h3>
                  <p className="text-sm font-medium text-slate-500 mt-1">Review your incorrect answers and their conceptual rationales.</p>
                </div>
                <button 
                  onClick={handleReRoll}
                  disabled={isReRolling}
                  className="bg-secondary hover:bg-orange-700 text-white px-6 py-3 rounded-full text-sm font-bold shadow-md transition-all flex items-center gap-2 active:scale-95 disabled:opacity-70 disabled:scale-100 cursor-pointer focus:ring-2 focus:ring-secondary focus:outline-none"
                >
                  {isReRolling ? <RefreshCw size={18} className="animate-spin" /> : <RefreshCw size={18} />}
                  {isReRolling ? 'Generating Micro-Quiz...' : 'Mistake Re-Roll'}
                </button>
              </div>

              <div className="flex flex-col gap-6">
                {incorrectQuestions.map((q, idx) => {
                  const userAnswer = answers[q.id - 1]; // Because q.id is 1-indexed and answers is 0-indexed based on currentIdx
                  const selectedOpt = q.options.find(o => o.id === userAnswer);
                  const correctOpt = q.options.find(o => o.id === q.correct);
                  
                  return (
                    <div key={idx} className="bg-background dark:bg-slate-950 rounded-xl p-6 border border-slate-200 dark:border-slate-800 relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-red-400"></div>
                      <h4 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4">{q.text}</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-xl p-4">
                          <span className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase tracking-widest block mb-1">You Selected</span>
                          <p className="text-sm font-medium text-red-900 dark:text-red-300">{selectedOpt ? selectedOpt.text : 'No Answer'}</p>
                        </div>
                        <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 rounded-xl p-4">
                          <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest block mb-1">Correct Answer</span>
                          <p className="text-sm font-medium text-emerald-900 dark:text-emerald-300">{correctOpt?.text}</p>
                        </div>
                      </div>
                      
                      <div className="bg-blue-900 text-white rounded-xl p-5 flex gap-4 mt-2 border border-transparent">
                        <BookOpen size={20} className="text-blue-200 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-[10px] font-bold text-blue-200 uppercase tracking-widest block mb-1">Concept Rationale</span>
                          <p className="text-sm font-medium leading-relaxed text-blue-100">{q.rationale}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          <div className="flex justify-center pt-4">
            <button 
              onClick={() => navigate('/learner')}
              className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 font-bold text-sm transition-colors cursor-pointer"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loadingDb) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900 gap-4">
        <Loader2 className="animate-spin text-blue-900 dark:text-blue-200" size={32} />
        <p className="text-sm font-bold text-slate-500">Initializing Assessment Engine...</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="flex flex-col h-full min-h-screen bg-background font-sans overflow-hidden p-8 justify-center items-center">
        <div className="max-w-2xl w-full">
          <M3EmptyState 
            icon={BookOpen}
            badge="Test Execution Runner"
            title="No Active Assessment"
            subtitle="You navigated directly to the assessment runner without an active assessment ID. Please select an assessment from your Learner Hub."
            actionLabel="Return to Learner Hub"
            onAction={() => navigate('/learner')}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background font-sans overflow-hidden">
      
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 sm:px-8 h-20 shrink-0 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-4 sm:gap-6">
          <button 
            onClick={() => navigate('/learner')}
            className="text-slate-400 hover:text-slate-800 dark:text-slate-500 dark:hover:text-slate-200 p-2.5 rounded-full hover:bg-background dark:hover:bg-slate-800 transition-colors bg-background border border-slate-200 dark:border-slate-800 flex items-center justify-center min-w-[44px] min-h-[44px] cursor-pointer focus:ring-2 focus:ring-primary focus:outline-none"
            aria-label="Exit assessment"
          >
            <X size={20} />
          </button>
          <div>
            <h1 className="text-lg sm:text-xl font-extrabold text-blue-900 dark:text-blue-100 leading-tight tracking-tight">
              {activeAssessment?.title || activeAssessment?.assessment_title || 'StatIQ Competency Assessment'}
            </h1>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
              {activeAssessment?.target_domain || activeAssessment?.target_cadre || 'MoSPI / NSSTA iGOT Karmayogi FRAC'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 sm:gap-8">
          <div className="hidden md:flex flex-col items-end">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Time Remaining</span>
            <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-mono font-bold text-lg">
              <Clock size={16} className={timeLeft < 60 ? 'text-red-500 animate-pulse' : 'text-blue-900 dark:text-blue-200'}/>
              <span className={timeLeft < 60 ? 'text-red-600' : ''}>{formatTime(timeLeft)}</span>
            </div>
          </div>
          <button 
            onClick={handleSubmit}
            className="bg-blue-900 hover:bg-blue-800 text-white px-5 sm:px-6 py-2 rounded-full font-bold text-sm border border-transparent transition-colors cursor-pointer min-h-[44px] focus:ring-2 focus:ring-offset-2 focus:ring-blue-900 shadow-sm"
          >
            Submit Test
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 w-full max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 overflow-y-auto">
        
        {/* Left: Question Canvas */}
        <section className="lg:col-span-8 xl:col-span-9 flex flex-col gap-6 min-w-0">
          
          <div className="md:hidden flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Time Remaining</span>
            <div className="flex items-center gap-1.5 font-mono font-bold">
              <Clock size={14} className={timeLeft < 60 ? 'text-red-500 animate-pulse' : 'text-slate-400'}/>
              <span className={timeLeft < 60 ? 'text-red-600' : 'text-slate-800 dark:text-slate-200'}>{formatTime(timeLeft)}</span>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div 
              key={currentIdx}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-md p-6 sm:p-10 flex-1 flex flex-col relative overflow-hidden"
            >
              {/* Question Header */}
              <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-900 text-white rounded-xl flex items-center justify-center text-lg font-black shadow-md border border-transparent">
                    {currentIdx + 1}
                  </div>
                  <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">Question {currentIdx + 1} of {questions.length}</span>
                </div>
                <button 
                  onClick={toggleFlag}
                  className={`p-2.5 rounded-full transition-colors border flex items-center justify-center min-h-[44px] min-w-[44px] cursor-pointer ${flags.has(currentIdx) ? 'bg-amber-100 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-200' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-slate-600 hover:bg-slate-100 border-slate-200 dark:border-slate-800'}`}
                  title={flags.has(currentIdx) ? "Remove flag" : "Flag for review"}
                >
                  <Flag size={20} className={flags.has(currentIdx) ? 'fill-amber-600' : ''} />
                </button>
              </div>

              {/* Question Content */}
              <div className="flex-1 flex flex-col">
                {q.section_name && (
                  <div className="mb-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 text-[10px] font-extrabold uppercase tracking-widest border border-indigo-200/40 w-fit">
                    <BookOpen size={10} />
                    {q.section_name}
                  </div>
                )}
                
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 leading-relaxed mb-6 tracking-tight">
                  {q.text}
                </h2>

                {q.data_table_markdown && (
                  <MarkdownTableRenderer markdown={q.data_table_markdown} />
                )}
                
                {/* Options */}
                <div className="flex flex-col gap-4">
                  {q.options.map((option) => {
                    const isSelected = answers[currentIdx] === option.id;
                    return (
                      <button
                        key={option.id}
                        onClick={() => handleSelect(option.id)}
                        className={`
                          group relative w-full text-left p-4 sm:p-5 rounded-xl border transition-all duration-200 outline-none focus:ring-4 focus:ring-blue-900/20 cursor-pointer
                          ${isSelected 
                            ? 'bg-blue-50/40 dark:bg-blue-900/50/20 border-blue-900 shadow-sm' 
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300'}
                        `}
                      >
                        <div className="flex items-start gap-4">
                          <div className={`
                            w-8 h-8 rounded-full border flex items-center justify-center shrink-0 mt-0.5 font-bold text-sm transition-colors shadow-sm
                            ${isSelected ? 'border-blue-900 bg-blue-900 text-white' : 'border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 group-hover:border-blue-900/50'}
                          `}>
                            {option.label}
                          </div>
                          <div className="flex-1">
                            <span className={`text-base sm:text-lg font-semibold transition-colors ${isSelected ? 'text-blue-900 dark:text-blue-200 font-bold' : 'text-slate-700 dark:text-slate-200'}`}>
                              {option.text}
                            </span>
                          </div>
                          <div className="hidden sm:flex shrink-0 w-6 h-6 rounded-full border border-slate-200 dark:border-slate-700 items-center justify-center text-[10px] font-bold text-slate-400 bg-slate-50 dark:bg-slate-900">
                            {option.keybind}
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
              
              <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs font-bold text-slate-400">
                <div className="flex items-center gap-1.5"><HelpCircle size={14}/> Need help? Press <kbd className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400">H</kbd> for hint</div>
                <div className="flex items-center gap-1.5">Press <kbd className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400">Enter</kbd> to submit/next</div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between gap-4 mt-2">
            <button 
              onClick={handlePrev}
              disabled={currentIdx === 0}
              className="px-6 py-4 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm min-h-[44px]"
            >
              <ChevronLeft size={20} /> <span className="hidden sm:inline">Previous</span>
            </button>
            
            {currentIdx === questions.length - 1 ? (
              <button 
                onClick={handleSubmit}
                className="flex-1 sm:flex-none px-10 py-4 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all flex items-center justify-center gap-2 shadow-md min-h-[44px] cursor-pointer border border-transparent"
              >
                Submit Test <CheckCircle2 size={20} />
              </button>
            ) : (
              <button 
                onClick={handleNext}
                className="flex-1 sm:flex-none px-10 py-4 rounded-full bg-blue-900 hover:bg-blue-800 text-white font-bold transition-all flex items-center justify-center gap-2 shadow-md min-h-[44px] cursor-pointer border border-transparent"
              >
                Next <ChevronRight size={20} />
              </button>
            )}
          </div>
        </section>

        {/* Right: Diagnostic & Navigation */}
        <aside className="lg:col-span-4 xl:col-span-3 flex flex-col gap-6 pb-10 lg:pb-0">
          
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-md sticky top-6">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-6">Question Navigator</h3>
            
            <div className="grid grid-cols-5 gap-3">
              {QUESTIONS.map((_, idx) => {
                const isCurrent = idx === currentIdx;
                const isAnswered = !!answers[idx];
                const isFlagged = flags.has(idx);

                return (
                  <button 
                    key={idx}
                    onClick={() => setCurrentIdx(idx)}
                    className={`
                      aspect-square flex items-center justify-center rounded-xl text-sm font-extrabold transition-all relative border min-h-[44px] min-w-[44px] cursor-pointer
                      ${isCurrent ? 'border-blue-900 ring-4 ring-blue-900/10 scale-115 z-10' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'}
                      ${isAnswered && !isCurrent ? 'bg-blue-50 text-blue-900 border-transparent dark:bg-blue-900/40 dark:text-blue-100' : ''}
                      ${!isAnswered && !isCurrent ? 'bg-white dark:bg-slate-800 text-slate-400' : ''}
                      ${isCurrent ? 'bg-blue-900 text-white' : ''}
                    `}
                    aria-label={`Go to question ${idx + 1}`}
                  >
                    {idx + 1}
                    {isFlagged && (
                      <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-amber-500 border-2 border-white dark:border-slate-900 rounded-full shadow-sm"></span>
                    )}
                  </button>
                )
              })}
            </div>

            <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-4">
              <div className="flex flex-col items-center justify-center p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-xl font-black text-slate-900 dark:text-slate-100">{Object.keys(answers).length}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Answered</span>
              </div>
              <div className="flex flex-col items-center justify-center p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-xl font-black text-slate-900 dark:text-slate-100">{questions.length - Object.keys(answers).length}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pending</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
