import React, { useState, useEffect } from 'react';
import { 
  Play, 
  CheckCircle2, 
  Clock, 
  BookOpen, 
  RotateCcw, 
  ChevronRight, 
  HelpCircle,
  Award
} from 'lucide-react';
import { M3EmptyState } from './M3EmptyState';

export interface AssignedAssessment {
  id: string;
  title: string;
  competencyAxis: string;
  questionsCount: number;
  durationMins: number;
  status: 'Pending' | 'Completed';
  score?: number;
}

// --- LEARNER ASSESSMENT TAB VIEW (M3 STYLED) ---
export const LearnerAssessmentTab: React.FC<{ 
  customAssessments?: any[];
  onStartQuiz: (id: string, assessmentObj?: any) => void;
}> = ({ customAssessments = [], onStartQuiz }) => {
  const [filter, setFilter] = useState<'All' | 'Pending' | 'Completed' | 'Mistake Re-Rolls'>('All');

  const allAssessments: AssignedAssessment[] = customAssessments.map(ca => ({
    id: ca.id,
    title: ca.title || ca.assessment_title || 'MoSPI Competency Diagnostic',
    competencyAxis: ca.target_domain || ca.topic_tag || 'Sampling',
    questionsCount: (ca.questions || []).length || 5,
    durationMins: Math.min(60, Math.max(10, ((ca.questions || []).length || 5) * 2)),
    status: ca.status === 'Completed' ? 'Completed' : 'Pending',
    score: ca.score
  }));

  const filteredAssessments = allAssessments.filter(item => {
    if (filter === 'Pending') return item.status === 'Pending';
    if (filter === 'Completed') return item.status === 'Completed';
    if (filter === 'Mistake Re-Rolls') return item.status === 'Completed' && (item.score || 0) < 100;
    return true;
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-6 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Assigned Assessments</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Execute compliance evaluations and self-paced diagnostic speed drills.</p>
          </div>

          {/* Filter Chips with Count Badges */}
          <div className="flex flex-wrap items-center gap-2">
            {(['All', 'Pending', 'Completed', 'Mistake Re-Rolls'] as const).map((chip) => {
              const active = filter === chip;
              const count = allAssessments.filter(item => {
                if (chip === 'Pending') return item.status === 'Pending';
                if (chip === 'Completed') return item.status === 'Completed';
                if (chip === 'Mistake Re-Rolls') return item.status === 'Completed' && (item.score || 0) < 100;
                return true;
              }).length;

              return (
                <button
                  key={chip}
                  onClick={() => setFilter(chip)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border flex items-center gap-1.5 ${
                    active 
                      ? 'bg-[#1A365D] text-white border-[#1A365D] shadow-sm' 
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <span>{chip === 'All' ? 'All Assigned' : chip}</span>
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${active ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Assessment Card Grid */}
        <div className="space-y-4">
          {filteredAssessments.length === 0 ? (
            <M3EmptyState 
              icon={BookOpen}
              badge="Learner Assessment Hub"
              title={`No Assessments Found for "${filter}"`}
              subtitle="Try selecting a different filter chip or ask your Trainer to publish assigned assessments."
              actionLabel="View All Assigned"
              onAction={() => setFilter('All Assigned')}
            />
          ) : (
            filteredAssessments.map((item) => {
              const customMatch = customAssessments.find(ca => ca.id === item.id);
              return (
                <div 
                  key={item.id} 
                  className="bg-white dark:bg-slate-900 rounded-[16px] border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-[#1A365D] transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 bg-blue-50 dark:bg-blue-950/40 text-[#1A365D] dark:text-blue-300 text-xs font-bold rounded-full">
                        {item.competencyAxis}
                      </span>
                      <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full ${
                        item.status === 'Completed' ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300' : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
                      }`}>
                        {item.status} {item.score ? `(${item.score}%)` : ''}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{item.title}</h3>
                    <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 pt-1">
                      <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" /> {item.questionsCount} Questions</span>
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {item.durationMins} Mins</span>
                    </div>
                  </div>

                  {/* Action Button */}
                  {item.status === 'Pending' ? (
                    <button
                      onClick={() => onStartQuiz(item.id, customMatch)}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#1A365D] hover:bg-[#0F294A] text-white font-semibold text-xs rounded-[12px] shadow transition-all active:scale-95 cursor-pointer"
                    >
                      <Play className="w-4 h-4 fill-white" /> Start Assessment
                    </button>
                  ) : (
                    <button
                      onClick={() => onStartQuiz(item.id, customMatch)}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs rounded-[12px] transition-all cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4" /> Review Rationale
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

// --- M3 INTERACTIVE QUIZRUNNER COMPONENT ---
export interface Question {
  id: string;
  question_text: string;
  options: string[];
  correct_option_index: number;
  explanation: string;
  bloom_level: string;
  data_table_markdown?: string;
}

export const M3QuizRunner: React.FC<{ 
  questions: Question[]; 
  assessmentTitle?: string;
  onComplete: (score: number) => void;
  onExit?: () => void;
}> = ({ questions, assessmentTitle, onComplete, onExit }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [showRationale, setShowRationale] = useState(false);
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>([]);
  const [isFinished, setIsFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(() => Math.min(3600, Math.max(600, (questions.length || 5) * 120)));

  useEffect(() => {
    if (isFinished) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isFinished]);

  // Keyboard navigation support (1-4 and Enter)
  useEffect(() => {
    if (isFinished) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['1', '2', '3', '4'].includes(e.key)) {
        setSelectedOption(parseInt(e.key) - 1);
      } else if (e.key === 'Enter' && selectedOption !== null && !showRationale) {
        handleOptionSubmit();
      } else if (e.key === 'Enter' && showRationale) {
        handleNextQuestion();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedOption, showRationale, isFinished]);

  const handleOptionSubmit = () => {
    if (selectedOption === null) return;
    const currentQ = questions[currentIndex];
    const newAnswers = [...userAnswers, selectedOption];
    setUserAnswers(newAnswers);

    if (selectedOption === currentQ.correct_option_index) {
      setScore(prev => prev + 1);
    }
    setShowRationale(true);
  };

  const handleNextQuestion = () => {
    const nextIndex = currentIndex + 1;
    if (nextIndex < questions.length) {
      setCurrentIndex(nextIndex);
      setSelectedOption(null);
      setShowRationale(false);
    } else {
      setIsFinished(true);
      const finalPct = Math.round(((score + (selectedOption === questions[currentIndex].correct_option_index ? 1 : 0)) / questions.length) * 100);
      onComplete(finalPct);
    }
  };

  const handleReRollWeak = () => {
    const missed = questions.filter((q, idx) => userAnswers[idx] !== q.correct_option_index);
    if (missed.length === 0) {
      alert("Perfect score! No weak questions to re-roll.");
      return;
    }
    setCurrentIndex(0);
    setSelectedOption(null);
    setShowRationale(false);
    setScore(0);
    setUserAnswers([]);
    setIsFinished(false);
  };

  const handleDownloadCertificate = () => {
    window.print();
  };

  if (isFinished) {
    const totalCount = questions.length;
    const correctCount = score;
    const pctScore = Math.round((correctCount / totalCount) * 100);
    const isPassed = pctScore >= 70;

    return (
      <div className="min-h-screen bg-[#FAF8FF] dark:bg-slate-950 p-4 sm:p-6 lg:p-10 font-sans">
        <div className="max-w-6xl mx-auto space-y-8">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div>
              <span className="px-3 py-1 bg-blue-50 dark:bg-blue-900/40 text-blue-900 dark:text-blue-100 text-[10px] font-extrabold uppercase tracking-widest rounded-full">
                Assessment Execution Summary
              </span>
              <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight mt-1">
                {assessmentTitle || 'Advanced Statistical Methodology Assessment'}
              </h1>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={handleReRollWeak}
                className="flex-1 sm:flex-none px-5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-full text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all cursor-pointer"
              >
                Re-Roll Weak Questions
              </button>
              <button
                onClick={onExit}
                className="flex-1 sm:flex-none px-6 py-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded-full text-xs font-bold shadow-sm transition-all cursor-pointer"
              >
                Return to Learner Hub
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left/Main Analytics Pane */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Mastery Score Gauge */}
              <div className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center gap-8">
                <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-slate-100 dark:text-slate-800"
                      strokeWidth="3.5"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className={isPassed ? "text-emerald-500" : "text-amber-500"}
                      strokeDasharray={`${pctScore}, 100`}
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center text-center">
                    <span className="text-3xl font-black text-slate-900 dark:text-slate-100">{pctScore}%</span>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Mastery</span>
                  </div>
                </div>

                <div className="space-y-2 text-center sm:text-left">
                  <span className={`px-3 py-1 text-xs font-black uppercase tracking-wider rounded-full border ${isPassed ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                    {isPassed ? '★ MASTERED & VERIFIED' : 'ACTION REQUIRED: RE-ROLL'}
                  </span>
                  <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">
                    {isPassed ? 'Demonstrated High Competency' : 'Additional Review Recommended'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Answered {correctCount} of {totalCount} questions correctly. Performance aligns with MoSPI FRAC Tier 2 Officer Standards.
                  </p>
                </div>
              </div>

              {/* FRAC Competency Breakdown */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">FRAC Competency Axis Analysis</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-100 dark:border-slate-800 space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Sampling Methods</span>
                    <span className="text-lg font-black text-slate-900 dark:text-slate-100">95%</span>
                    <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-blue-900 h-full w-[95%]" />
                    </div>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-100 dark:border-slate-800 space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">National Accounts</span>
                    <span className="text-lg font-black text-slate-900 dark:text-slate-100">88%</span>
                    <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-blue-900 h-full w-[88%]" />
                    </div>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-100 dark:border-slate-800 space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Indices & Inflation</span>
                    <span className="text-lg font-black text-slate-900 dark:text-slate-100">90%</span>
                    <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-blue-900 h-full w-[90%]" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Bloom's Cognitive Depth */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Bloom's Cognitive Taxonomy Depth</h4>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      <span>L1: Recall (Definitions & Manual Rules)</span>
                      <span>100%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full w-[100%]" />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      <span>L2: Application (Formula Computation)</span>
                      <span>88%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-blue-900 h-full w-[88%]" />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      <span>L3: Scenario (Field Outlier Edge Cases)</span>
                      <span>80%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-amber-500 h-full w-[80%]" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Question Rationale Review List */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Detailed Question Rationale Breakdown</h4>
                <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                  {questions.map((q, idx) => {
                    const userChoice = userAnswers[idx];
                    const isRight = userChoice === q.correct_option_index;
                    return (
                      <div key={q.id || idx} className={`p-4 rounded-xl border ${isRight ? 'bg-emerald-50/30 border-emerald-200/60' : 'bg-red-50/30 border-red-200/60'} space-y-2`}>
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-extrabold text-slate-900 dark:text-slate-100">Q{idx + 1}: {q.question_text}</span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${isRight ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                            {isRight ? 'Correct ✓' : 'Incorrect ✗'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          <strong>Your Answer:</strong> {userChoice !== undefined && userChoice !== null ? q.options[userChoice] : 'Not answered'}
                        </p>
                        {!isRight && (
                          <p className="text-xs text-emerald-700 dark:text-emerald-300 font-bold">
                            <strong>Correct Answer:</strong> {q.options[q.correct_option_index]}
                          </p>
                        )}
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 italic">
                          <strong>Rationale:</strong> {q.explanation}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Right Certificate Panel */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white dark:bg-slate-900 p-8 rounded-xl border-2 border-[#1A365D] dark:border-[#D0BCFF] shadow-xl space-y-6 text-center">
                <div className="flex items-center justify-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                  <Award className="w-8 h-8 text-blue-900" />
                  <div className="text-left">
                    <span className="text-[9px] font-extrabold text-blue-900 uppercase tracking-widest block">MoSPI / NSSTA Verified</span>
                    <h4 className="text-sm font-black text-slate-900 dark:text-slate-100">Official Certificate of Competency</h4>
                  </div>
                </div>

                <div className="space-y-3 py-2">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">This certifies that</p>
                  <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 border-b-2 border-slate-200 pb-2">
                    Dr. Aisha Sharma
                  </h2>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    has successfully demonstrated mastery in <strong>{assessmentTitle || 'Statistical Survey Methods & National Accounts'}</strong> under the iGOT Karmayogi FRAC Framework.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-left text-xs font-mono">
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 block uppercase">Verification ID</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">NSSTA-STATIQ-2026-9921</span>
                  </div>
                  <div className="w-10 h-10 bg-slate-900 text-white font-bold text-[8px] flex items-center justify-center text-center rounded-lg">
                    QR VERIFIED
                  </div>
                </div>

                <button
                  onClick={handleDownloadCertificate}
                  className="w-full py-3.5 bg-[#1A365D] hover:bg-[#0F294A] text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Award className="w-4 h-4" /> Download Official PDF Certificate
                </button>
              </div>
            </div>

          </div>

        </div>
      </div>
    );
  }

  if (!questions || questions.length === 0) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 flex flex-col justify-center items-center p-6 text-center">
        <p className="text-sm font-bold text-slate-500 mb-4">No questions loaded for this assessment.</p>
        <button onClick={onExit} className="px-6 py-2.5 bg-[#1A365D] text-white text-xs font-bold rounded-xl cursor-pointer">Return to Hub</button>
      </div>
    );
  }

  const currentQ = questions[currentIndex];

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 flex flex-col justify-center items-center p-6">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[24px] border border-slate-200 dark:border-slate-800 p-8 shadow-sm space-y-6">
        
        {/* Top Progress & Timer Header */}
        <div className="flex justify-between items-center text-xs font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            {onExit && (
              <button onClick={onExit} className="text-slate-400 hover:text-slate-700 text-xs font-bold cursor-pointer">← Exit</button>
            )}
            <span className="font-bold text-slate-900 dark:text-slate-100">{assessmentTitle || 'StatIQ M3 QuizRunner'}</span>
            <span>Question {currentIndex + 1} of {questions.length}</span>
          </div>
          <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 rounded-full border border-amber-200 dark:border-amber-900/30">
            <Clock className="w-3.5 h-3.5" /> {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
          </span>
        </div>

        {/* Question Text */}
        <div className="space-y-2">
          <span className="px-2.5 py-0.5 bg-blue-50 dark:bg-blue-950/40 text-[#1A365D] dark:text-blue-300 text-[10px] font-bold rounded-md">
            {currentQ.bloom_level || 'L2: Application'}
          </span>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">{currentQ.question_text}</h2>
        </div>

        {/* Optional Data Table */}
        {currentQ.data_table_markdown && (
          <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl overflow-x-auto text-xs font-mono">
            <pre className="text-slate-700 dark:text-slate-300">{currentQ.data_table_markdown}</pre>
          </div>
        )}

        {/* Options List (Segmented Cards) */}
        <div className="space-y-3">
          {currentQ.options.map((opt, idx) => {
            const isSelected = selectedOption === idx;
            const isCorrect = idx === currentQ.correct_option_index;
            let styling = "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-400 text-slate-800 dark:text-slate-200";
            
            if (showRationale) {
              if (isCorrect) styling = "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-bold";
              else if (isSelected && !isCorrect) styling = "border-red-500 bg-red-50 dark:bg-red-950/40 text-red-900 dark:text-red-200";
            } else if (isSelected) {
              styling = "border-[#1A365D] dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/30 text-[#1A365D] dark:text-blue-200 font-bold";
            }

            return (
              <button
                key={idx}
                disabled={showRationale}
                onClick={() => setSelectedOption(idx)}
                className={`w-full text-left p-4 rounded-[12px] border-2 transition-all flex items-center justify-between cursor-pointer ${styling}`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300">
                    {['A', 'B', 'C', 'D'][idx]}
                  </span>
                  <span className="text-sm font-medium">{opt}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Rationale Drawer (Post-Submit) */}
        {showRationale && (
          <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[12px] space-y-2 animate-fade-in">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-[#1A365D] dark:text-blue-200" /> Official Methodology Rationale:
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{currentQ.explanation}</p>
          </div>
        )}

        {/* Action Button Footer */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          {!showRationale ? (
            <button
              disabled={selectedOption === null}
              onClick={handleOptionSubmit}
              className={`px-8 py-3 rounded-[12px] font-semibold text-xs transition-all cursor-pointer ${
                selectedOption !== null 
                  ? 'bg-[#1A365D] hover:bg-[#0F294A] text-white shadow' 
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
              }`}
            >
              Submit Answer (Enter)
            </button>
          ) : (
            <button
              onClick={handleNextQuestion}
              className="px-8 py-3 bg-[#F59E0B] hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-[12px] shadow transition-all flex items-center gap-1.5 cursor-pointer"
            >
              Next Question <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
