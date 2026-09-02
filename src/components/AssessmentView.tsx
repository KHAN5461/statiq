import React, { useState, useEffect } from 'react';
import { ViewState } from '../types';
import { 
  X, Timer, Flag, ChevronLeft, ChevronRight, BarChart2, 
  CheckCircle2, XCircle, Trophy, RotateCcw,
  CheckSquare, Info, Target, ShieldCheck, ArrowRight, ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AssessmentViewProps {
  setCurrentView: (view: ViewState) => void;
}

const QUESTIONS = [
  {
    id: 0,
    type: 'Application',
    concept: 'Multicollinearity & Ridge Regression',
    text: 'In a multiple regression model, which of the following scenarios best justifies the use of Ridge Regression over Ordinary Least Squares (OLS)?',
    context: 'Consider a dataset where the number of predictor variables (p) is close to or exceeds the number of observations (n), and there is known severe multicollinearity among several predictors.',
    options: [
      { id: 'A', text: 'When unbiased estimates of coefficients are strictly required for regulatory reporting.' },
      { id: 'B', text: 'When the primary goal is feature selection to eliminate irrelevant predictors entirely.' },
      { id: 'C', text: 'When multicollinearity leads to highly unstable OLS estimates with large variances.' },
      { id: 'D', text: 'When the dataset contains categorical variables that cannot be handled by OLS.' }
    ],
    correct: 'C',
    explanation: 'Ridge regression introduces a penalty term that shrinks coefficients, reducing variance at the cost of introducing some bias, which is ideal for handling severe multicollinearity.'
  },
  {
    id: 1,
    type: 'Recall',
    concept: 'Macroeconomic Base Years',
    text: 'According to the updated CPI manual, what is the primary weighting base year currently utilized for rural area index calculation?',
    context: 'Price indices are periodically updated to reflect changing consumption patterns.',
    options: [
      { id: 'A', text: '2001=100' },
      { id: 'B', text: '2011-12=100' },
      { id: 'C', text: '2012=100' },
      { id: 'D', text: '2015=100' }
    ],
    correct: 'C',
    explanation: 'The base year for CPI was revised to 2012=100 with effect from January 2015 indices.'
  },
  {
    id: 2,
    type: 'Analysis',
    concept: 'Data Skewness & Central Tendency',
    text: 'When analyzing a positively skewed distribution of household income, which measure of central tendency is typically the most representative?',
    context: 'Income distributions in large populations rarely follow a perfectly normal curve.',
    options: [
      { id: 'A', text: 'The Mean, as it incorporates all values in the dataset.' },
      { id: 'B', text: 'The Median, as it is less affected by extreme high values in the right tail.' },
      { id: 'C', text: 'The Mode, because it represents the most frequently occurring income level.' },
      { id: 'D', text: 'The Geometric Mean, for handling compound growth rates.' }
    ],
    correct: 'B',
    explanation: 'In positively skewed distributions (like income), the mean is pulled towards the long right tail, making the median a more robust and representative measure of central tendency.'
  },
  {
    id: 3,
    type: 'Application',
    concept: 'Survey Sampling Protocols',
    text: 'Which sampling method is most appropriate when surveying a population with highly distinct sub-groups that vary significantly in size?',
    context: 'Ensuring representation of minority groups is crucial for accurate national statistics.',
    options: [
      { id: 'A', text: 'Simple Random Sampling' },
      { id: 'B', text: 'Systematic Sampling' },
      { id: 'C', text: 'Stratified Random Sampling' },
      { id: 'D', text: 'Convenience Sampling' }
    ],
    correct: 'C',
    explanation: 'Stratified sampling ensures that smaller sub-groups (strata) are adequately represented by sampling proportionately or disproportionately from each distinct group.'
  },
  {
    id: 4,
    type: 'Recall',
    concept: 'Karmayogi Competency Pillars',
    text: 'Under the FRAC (Framework of Roles, Activities, and Competencies), which pillar focuses specifically on behavioral traits required for effective public service?',
    context: 'Mission Karmayogi relies on a tri-pillar competency framework.',
    options: [
      { id: 'A', text: 'Domain Competencies' },
      { id: 'B', text: 'Functional Competencies' },
      { id: 'C', text: 'Behavioral Competencies' },
      { id: 'D', text: 'Technical Competencies' }
    ],
    correct: 'C',
    explanation: 'Behavioral competencies focus on personal attributes, values, and traits, distinct from domain (subject matter) and functional (process) competencies.'
  }
];

export function AssessmentView({ setCurrentView }: AssessmentViewProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [flags, setFlags] = useState<Set<number>>(new Set());
  const [submitted, setSubmitted] = useState(false);

  const q = QUESTIONS[currentIdx];

  const handleSelect = (optId: string) => {
    setAnswers(prev => ({ ...prev, [currentIdx]: optId }));
  };

  const toggleFlag = () => {
    const newFlags = new Set(flags);
    if (newFlags.has(currentIdx)) newFlags.delete(currentIdx);
    else newFlags.add(currentIdx);
    setFlags(newFlags);
  };

  const handleNext = () => {
    if (currentIdx < QUESTIONS.length - 1) setCurrentIdx(currentIdx + 1);
  };

  const handlePrev = () => {
    if (currentIdx > 0) setCurrentIdx(currentIdx - 1);
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
      } else if (key === 'ARROWRIGHT') {
        if (currentIdx < QUESTIONS.length - 1) handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIdx, q, submitted]);

  const handleSubmit = () => {
    if (Object.keys(answers).length < QUESTIONS.length) {
      if (!window.confirm("You have unanswered questions. Are you sure you want to submit?")) return;
    }
    setSubmitted(true);
  };

  const score = Object.keys(answers).reduce((acc, qId) => {
    const question = QUESTIONS[Number(qId)];
    return acc + (answers[Number(qId)] === question.correct ? 1 : 0);
  }, 0);
  const percentage = Math.round((score / QUESTIONS.length) * 100);
  
  const circumference = 2 * Math.PI * 46;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 sm:p-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white max-w-4xl w-full rounded-3xl p-6 md:p-10 border border-slate-200 shadow-xl flex flex-col items-center text-center max-h-full overflow-hidden"
        >
          <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-6 shadow-inner ${percentage >= 80 ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
            <Trophy size={40} />
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-2">Assessment Complete</h1>
          <p className="text-base md:text-lg text-slate-500 mb-10 font-medium">Advanced Statistical Methods (Module 3)</p>
          
          <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12 mb-10 w-full justify-center bg-background p-6 rounded-[20px] border border-border-color">
             {/* circular progress */}
             <div className="relative w-32 h-32 shrink-0">
               <svg className="w-full h-full transform -rotate-90 filter drop-shadow-sm">
                 <circle cx="64" cy="64" r="46" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-200" />
                 <motion.circle 
                   cx="64" cy="64" r="46" 
                   stroke="currentColor" 
                   strokeWidth="12" 
                   fill="transparent" 
                   strokeDasharray={circumference}
                   initial={{ strokeDashoffset: circumference }}
                   animate={{ strokeDashoffset }}
                   transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
                   className={percentage >= 80 ? 'text-green-500' : 'text-amber-500'} 
                   strokeLinecap="round"
                 />
               </svg>
               <div className="absolute inset-0 flex items-center justify-center flex-col">
                 <span className="text-2xl font-black text-slate-900 tracking-tight">{percentage}%</span>
               </div>
             </div>
             
             <div className="flex flex-col gap-5 text-center md:text-left">
               <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Total Score</h4>
                  <p className="text-2xl font-extrabold text-slate-800">{score} <span className="text-slate-400 text-lg font-bold">out of</span> {QUESTIONS.length} <span className="text-slate-400 text-lg font-bold">correct</span></p>
               </div>
               <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Status</h4>
                  <p className={`text-sm font-bold px-4 py-2 rounded-full inline-flex shadow-sm border ${percentage >= 80 ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                    {percentage >= 80 ? 'Proficiency Demonstrated' : 'Further Review Recommended'}
                  </p>
               </div>
             </div>
          </div>

          <div className="w-full text-left bg-background p-6 md:p-8 rounded-[20px] border border-border-color mb-8 flex flex-col min-h-0 relative">
            <div className="absolute top-0 left-0 w-full h-8 bg-gradient-to-b from-background to-transparent z-10 rounded-t-[20px]"></div>
            <h3 className="text-xl font-extrabold text-slate-900 mb-6 flex items-center gap-3 shrink-0 relative z-20">
              <BarChart2 className="text-primary"/> 
              Diagnostic Breakdown
            </h3>
            <div className="space-y-4 overflow-y-auto pr-2 pb-4 relative z-10" style={{ maxHeight: '400px' }}>
              {QUESTIONS.map((question, i) => {
                const isCorrect = answers[i] === question.correct;
                const answered = answers[i];
                return (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * i }}
                    key={i} 
                    className={`p-5 rounded-xl border-2 transition-all ${isCorrect ? 'bg-surface border-green-200 shadow-sm' : 'bg-surface border-red-200 shadow-sm'}`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`p-2 rounded-full shrink-0 mt-0.5 ${isCorrect ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                        {isCorrect ? <CheckCircle2 strokeWidth={3} size={20} /> : <XCircle strokeWidth={3} size={20} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                           <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Question {i+1}</span>
                           <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                           <span className="text-[10px] font-bold bg-slate-200 text-slate-600 px-3 py-1 rounded-full uppercase tracking-wider">{question.type}</span>
                        </div>
                        <p className="font-bold text-base mb-4 text-slate-900">{question.text}</p>
                        
                        {!isCorrect && (
                          <div className="mt-4 flex flex-col md:flex-row gap-4">
                            <div className="flex-1 bg-red-50 p-4 rounded-xl border border-red-100">
                              <span className="text-[11px] font-bold text-red-800/70 uppercase tracking-widest block mb-1">Your Answer</span>
                              <span className="text-sm font-bold text-red-900">{answered ? question.options.find(o => o.id === answered)?.text : 'No answer provided'}</span>
                            </div>
                            <div className="flex-1 bg-green-50 p-4 rounded-xl border border-green-100">
                              <span className="text-[11px] font-bold text-green-800/70 uppercase tracking-widest block mb-1">Correct Answer</span>
                              <span className="text-sm font-bold text-green-900">{question.options.find(o => o.id === question.correct)?.text}</span>
                            </div>
                          </div>
                        )}
                        
                        <div className="mt-4 bg-background p-4 rounded-xl border border-border-color relative">
                           <div className="flex items-center gap-2 mb-3">
                             <span className="px-3 py-1.5 bg-surface border border-border-color text-slate-600 rounded-full text-[10px] font-bold uppercase shadow-sm">
                               Concept Mapped: {question.concept}
                             </span>
                           </div>
                           <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Methodology Explanation</span>
                           <p className="text-sm text-slate-700 font-medium leading-relaxed">{question.explanation}</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
            <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-background to-transparent z-10 rounded-b-[20px] pointer-events-none"></div>
          </div>
          
          {/* Skill Gap Delta & Recommended Interventions */}
          <div className="w-full text-left bg-surface p-6 md:p-8 rounded-[20px] border border-border-color mb-8 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-extrabold text-slate-900 flex items-center gap-3">
                <Target className="text-accent" /> 
                Skill Gap Delta & Recommendations
              </h3>
              <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold border border-primary/20">
                FRAC Aligned
              </span>
            </div>
            
            <p className="text-sm text-slate-600 mb-6 font-medium leading-relaxed">
              Based on your assessment, we detected a <span className="font-bold text-slate-900">{100 - percentage}% competency gap</span> in Advanced Statistical Methods. The following official interventions have been dynamically matched to bridge these deficiencies.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <motion.div 
                whileHover={{ y: -2 }}
                className="p-5 rounded-[20px] border border-border-color hover:border-accent hover:shadow-md transition-all cursor-pointer bg-background group"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent group-hover:scale-110 transition-transform">
                    <Target size={20} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">iGOT Karmayogi</h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Self-Paced Module</p>
                  </div>
                </div>
                <h5 className="font-bold text-sm text-slate-800 mb-2">Advanced Sampling Techniques</h5>
                <p className="text-xs text-slate-500 mb-4 line-clamp-2">Complete this module to improve your foundational knowledge on complex survey designs and variance estimation.</p>
                <div className="flex items-center justify-between mt-auto">
                  <span className="text-xs font-bold text-accent">2 Hours</span>
                  <ExternalLink size={16} className="text-slate-400 group-hover:text-accent transition-colors" />
                </div>
              </motion.div>

              <motion.div 
                whileHover={{ y: -2 }}
                className="p-5 rounded-[20px] border border-border-color hover:border-green-500 hover:shadow-md transition-all cursor-pointer bg-background group"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 group-hover:scale-110 transition-transform">
                    <ShieldCheck size={20} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">NSSTA Workshop</h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Live Virtual Training</p>
                  </div>
                </div>
                <h5 className="font-bold text-sm text-slate-800 mb-2">MoSPI Data Validation Protocols</h5>
                <p className="text-xs text-slate-500 mb-4 line-clamp-2">Interactive workshop focused on rectifying common statistical discrepancies found in recent FOD surveys.</p>
                <div className="flex items-center justify-between mt-auto">
                  <span className="text-xs font-bold text-green-600">Upcoming: Oct 12</span>
                  <ExternalLink size={16} className="text-slate-400 group-hover:text-green-600 transition-colors" />
                </div>
              </motion.div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full shrink-0">
            <button onClick={() => setCurrentView('learner')} className="flex-1 px-6 py-4 bg-surface border-2 border-border-color text-slate-700 rounded-full font-bold hover:bg-background transition-all flex items-center justify-center gap-2 active:scale-95 shadow-sm min-h-[56px]">
              <X size={20} strokeWidth={2.5} /> Exit to Dashboard
            </button>
            <button onClick={() => { setSubmitted(false); setCurrentIdx(0); setAnswers({}); setFlags(new Set()); }} className="flex-1 px-6 py-4 bg-primary text-white rounded-full font-bold hover:bg-primary-light transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20 active:scale-95 min-h-[56px]">
              <RotateCcw size={20} strokeWidth={2.5} /> Retake Assessment
            </button>
          </div>
          
          {/* Phase 6: Post-Assessment Micro-Survey */}
          <div className="w-full mt-10 pt-8 border-t border-slate-100 flex flex-col items-center">
            <p className="text-sm font-bold text-slate-500 mb-4 uppercase tracking-widest">How accurately did this test reflect your daily tasks?</p>
            <div className="flex gap-2 w-full max-w-sm">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button 
                  key={rating}
                  onClick={(e) => {
                    const btn = e.currentTarget;
                    const container = btn.parentElement;
                    if(container) container.innerHTML = '<span class="text-sm font-bold text-green-600 bg-green-50 px-4 py-2 rounded-full w-full text-center border border-green-200">Thank you for your feedback!</span>';
                  }}
                  className="flex-1 h-12 bg-background hover:bg-primary/10 hover:text-primary hover:border-primary border border-border-color rounded-full text-slate-600 font-bold transition-colors active:scale-95"
                  aria-label={`Rate ${rating} out of 5`}
                >
                  {rating}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-background font-sans overflow-hidden">
      
      {/* Header */}
      <header className="bg-surface border-b border-border-color p-4 sm:px-8 h-20 shrink-0 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-4 sm:gap-6">
          <button 
            onClick={() => setCurrentView('learner')}
            className="text-slate-400 hover:text-slate-800 p-2.5 rounded-full hover:bg-background transition-colors bg-background border border-border-color min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Exit assessment"
          >
            <X size={20} />
          </button>
          <div>
            <h1 className="text-lg sm:text-xl font-extrabold text-primary leading-tight tracking-tight">Advanced Statistical Methods</h1>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Module 3 Assessment</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 sm:gap-8">
          <div className="hidden md:flex flex-col items-end">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5" aria-live="polite">Progress {currentIdx + 1} of {QUESTIONS.length}</span>
            <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden" aria-hidden="true">
              <div className="h-full bg-primary transition-all duration-300" style={{ width: `${((currentIdx + 1) / QUESTIONS.length) * 100}%` }}></div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 bg-background border border-border-color px-4 py-2 rounded-full" role="timer" aria-live="polite" aria-atomic="true">
            <Timer size={18} className="text-slate-500 animate-pulse" aria-hidden="true" />
            <span className="text-sm font-mono font-bold text-slate-800 tracking-wider">08:45</span>
          </div>
          
          <button 
            onClick={toggleFlag}
            className={`hidden sm:flex items-center justify-center gap-2 text-sm font-bold px-4 py-2 rounded-full transition-colors border min-h-[44px] ${flags.has(currentIdx) ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-surface text-slate-500 border-border-color hover:bg-background hover:text-slate-700'}`}
            aria-pressed={flags.has(currentIdx)}
          >
            <Flag size={16} className={flags.has(currentIdx) ? 'fill-current' : ''} /> {flags.has(currentIdx) ? 'Flagged' : 'Flag for Review'}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 w-full max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 overflow-y-auto">
        
        {/* Left: Question Canvas */}
        <section className="lg:col-span-8 xl:col-span-9 flex flex-col gap-6 min-w-0">
          
          <AnimatePresence mode="wait">
            <motion.div 
              key={currentIdx}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-6"
            >
              {/* Question Prompt & Progressive Disclosure */}
              <div className="bg-surface p-8 md:p-10 rounded-[20px] border border-border-color shadow-sm relative">
                <div className="flex flex-col md:flex-row gap-8">
                  
                  {/* Left Column: Context (Progressive Disclosure) */}
                  <div className="md:w-1/3 flex flex-col gap-4 border-b md:border-b-0 md:border-r border-border-color pb-6 md:pb-0 md:pr-8">
                    <span className="inline-flex self-start px-4 py-1.5 bg-accent/10 text-accent border border-accent/20 rounded-full text-[11px] font-bold uppercase tracking-widest mb-2">
                      {q.type} Focus
                    </span>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2 text-slate-500 mb-1">
                        <Info size={16} strokeWidth={2.5} />
                        <span className="font-bold uppercase text-[10px] tracking-widest">Case Context</span>
                      </div>
                      <p className="text-slate-600 leading-relaxed text-sm font-medium">
                        {q.context}
                      </p>
                    </div>
                  </div>

                  {/* Right Column: Question Text */}
                  <div className="md:w-2/3 flex flex-col justify-center">
                    <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 leading-snug tracking-tight">
                      {q.text}
                    </h2>
                  </div>
                </div>
              </div>

              {/* Options */}
              <div className="flex flex-col gap-4">
                {q.options.map((opt) => {
                  const isSelected = answers[currentIdx] === opt.id;
                  return (
                    <motion.label 
                      key={opt.id}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      className={`
                        relative flex items-start p-5 rounded-2xl cursor-pointer transition-colors border-2
                        ${isSelected 
                          ? 'bg-primary/5 border-primary shadow-sm' 
                          : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300'}
                      `}
                    >
                      <input 
                        type="radio" 
                        name={`q${currentIdx}`}
                        value={opt.id} 
                        checked={isSelected}
                        onChange={() => handleSelect(opt.id)}
                        className="sr-only"
                      />
                      <div className={`
                        w-10 h-10 shrink-0 flex items-center justify-center rounded-xl mr-5 text-base font-black border-2 transition-colors relative
                        ${isSelected 
                          ? 'bg-primary border-primary text-white shadow-inner' 
                          : 'bg-slate-50 border-slate-200 text-slate-400'}
                      `}>
                        {opt.id}
                        {isSelected && (
                          <motion.div layoutId="outline" className="absolute -inset-1 border-2 border-primary/30 rounded-xl" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />
                        )}
                      </div>
                      <span className={`text-base pt-1.5 leading-relaxed ${isSelected ? 'text-primary font-bold' : 'text-slate-700 font-medium'}`}>
                        {opt.text}
                      </span>
                      <AnimatePresence>
                        {isSelected && (
                          <motion.div 
                            initial={{ scale: 0.5, opacity: 0 }} 
                            animate={{ scale: 1, opacity: 1 }} 
                            exit={{ scale: 0.5, opacity: 0 }}
                            className="absolute right-5 top-1/2 -translate-y-1/2"
                          >
                            <CheckCircle2 size={24} fill="currentColor" className="text-primary bg-white rounded-full shadow-sm" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.label>
                  )
                })}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Bottom Nav */}
          <div className="flex justify-between items-center mt-6 pt-8 border-t border-border-color pb-10 lg:pb-0">
            <button 
              onClick={handlePrev}
              disabled={currentIdx === 0}
              className="px-6 py-3 bg-surface border-2 border-border-color text-slate-600 rounded-full hover:bg-background text-sm font-bold transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
            >
              <ChevronLeft size={18} strokeWidth={3} /> Previous
            </button>
            <button 
              onClick={currentIdx === QUESTIONS.length - 1 ? handleSubmit : handleNext}
              className="px-8 py-3 bg-primary text-white rounded-full hover:bg-primary-light text-sm font-bold transition-all flex items-center gap-2 shadow-lg shadow-primary/20 active:scale-95"
            >
              {currentIdx === QUESTIONS.length - 1 ? 'Submit Assessment' : 'Next Question'} 
              {currentIdx !== QUESTIONS.length - 1 && <ChevronRight size={18} strokeWidth={3} />}
            </button>
          </div>
        </section>

        {/* Right: Diagnostic & Navigation */}
        <aside className="lg:col-span-4 xl:col-span-3 flex flex-col gap-6 pb-10 lg:pb-0">
          
          <div className="bg-surface p-6 rounded-[20px] border border-border-color shadow-sm sticky top-6">
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
                      aspect-square flex items-center justify-center rounded-full text-sm font-extrabold transition-all relative border-2
                      ${isCurrent ? 'border-primary ring-4 ring-primary/10 scale-110 z-10' : 'border-border-color hover:border-slate-300'}
                      ${isAnswered && !isCurrent ? 'bg-primary/10 text-primary border-transparent' : ''}
                      ${!isAnswered && !isCurrent ? 'bg-surface text-slate-400' : ''}
                      ${isCurrent ? 'bg-primary text-white' : ''}
                    `}
                  >
                    {idx + 1}
                    {isFlagged && (
                      <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-amber-500 border-2 border-white rounded-full"></span>
                    )}
                  </button>
                )
              })}
            </div>

            <div className="mt-8 pt-6 border-t border-border-color">
              <button 
                onClick={handleSubmit}
                className="w-full py-3.5 bg-slate-900 hover:bg-black text-white rounded-full text-sm font-bold transition-colors shadow-md active:scale-95"
              >
                End & Submit
              </button>
            </div>
          </div>

        </aside>
      </div>
    </div>
  );
}
