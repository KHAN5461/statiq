import React, { useState } from 'react';
import { 
  UploadCloud, 
  Settings2, 
  Eye, 
  Sparkles,
  ChevronDown,
  FileText,
  CheckCircle2,
  Loader2,
  Zap,
  Trash2,
  Save,
  Send,
  PlayCircle,
  AlertCircle
} from 'lucide-react';
import { ViewState } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface GeneratorViewProps {
  setCurrentView: (view: ViewState) => void;
}

const generationSteps = [
  "Initializing LLM Engine...",
  "Extracting tokens from document...",
  "Mapping context to FRAC taxonomy...",
  "Generating distractor options...",
  "Finalizing JSON Assessment..."
];

interface QuizQuestion {
  id: string;
  question_text: string;
  options: string[];
  correct_option_index: number;
  bloom_taxonomy_level: string;
  explanation: string;
  topic_tag: string;
}

export function GeneratorView({ setCurrentView }: GeneratorViewProps) {
  const [viewState, setViewState] = useState<'ingestion' | 'curation' | 'taking'>('ingestion');
  const [activeTab, setActiveTab] = useState<'upload' | 'text'>('upload');
  const [file, setFile] = useState<string | null>(null);
  const [sourceText, setSourceText] = useState('');
  const [generating, setGenerating] = useState(false);
  const [genStep, setGenStep] = useState(0);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [assessmentMeta, setAssessmentMeta] = useState({ title: '', competency: '', difficulty: '' });
  const [error, setError] = useState<string | null>(null);
  
  // Simulator State
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    setGenStep(0);
    
    // Fake progress animation
    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < generationSteps.length - 1) {
        currentStep++;
        setGenStep(currentStep);
      }
    }, 800);

    try {
      const textToProcess = activeTab === 'text' ? sourceText : (file ? `Document: ${file}. Please generate general statistical questions if no content is provided.` : 'Basic statistical principles.');
      
      const res = await fetch('/api/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceText: textToProcess })
      });
      
      if (!res.ok) throw new Error('Failed to generate quiz');
      
      const data = await res.json();
      setQuestions(data.questions || []);
      setAssessmentMeta({
        title: data.assessment_title || 'Generated Assessment',
        competency: data.target_competency || 'General',
        difficulty: data.difficulty_level || 'Intermediate'
      });
      
      clearInterval(interval);
      setGenStep(generationSteps.length - 1);
      
      setTimeout(() => {
        setGenerating(false);
        setViewState('curation');
      }, 600);
      
    } catch (err: any) {
      clearInterval(interval);
      setGenerating(false);
      setError(err.message || 'An error occurred during generation');
    }
  };

  const handleSimulateQuiz = () => {
    setViewState('taking');
    setCurrentQIndex(0);
    setSelectedAnswers({});
    setShowResults(false);
  };

  const calculateScore = () => {
    let score = 0;
    questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correct_option_index) score++;
    });
    return score;
  };

  return (
    <div className="flex flex-col h-full bg-background relative overflow-hidden">
      
      {/* Loading Overlay */}
      <AnimatePresence>
        {generating && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full flex flex-col items-center text-center"
            >
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 relative">
                <Loader2 size={40} className="text-primary animate-spin" />
                <Sparkles size={16} className="text-accent absolute top-2 right-2 animate-pulse" />
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Generating Assessment</h2>
              <div className="h-6 overflow-hidden mb-8 relative w-full">
                <AnimatePresence mode="wait">
                  <motion.p 
                    key={genStep}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -20, opacity: 0 }}
                    className="text-sm font-bold text-slate-500 absolute w-full"
                  >
                    {generationSteps[genStep]}
                  </motion.p>
                </AnimatePresence>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-primary rounded-full"
                  initial={{ width: '0%' }}
                  animate={{ width: `${((genStep + 1) / generationSteps.length) * 100}%` }}
                  transition={{ duration: 0.8 }}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto w-full flex-1 flex flex-col gap-8">
        
        {/* Header */}
        <div className="border-b border-slate-200 pb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {viewState === 'ingestion' ? 'Document Ingestion & AI Parser' : 'Trainer Curation & Validation'}
            </h1>
            <p className="text-slate-500 font-medium mt-2">
              {viewState === 'ingestion' 
                ? 'Upload MoSPI circulars to automatically generate competency assessments.' 
                : 'Review, edit, and map the generated questions to FRAC competencies before publishing.'}
            </p>
          </div>
          <div className="flex items-center gap-2 bg-accent/10 text-accent px-4 py-2 rounded-full font-bold text-sm border border-accent/20 shadow-sm">
            {viewState === 'ingestion' ? (
              <><Zap size={16} className="animate-pulse" /> LLM Parser Ready</>
            ) : (
              <><Settings2 size={16} className="animate-pulse" /> Draft Mode</>
            )}
          </div>
        </div>

        {/* Dynamic View */}
        {viewState === 'ingestion' ? (
          <div className="flex flex-col xl:flex-row gap-8 flex-1 min-h-0 pb-10">
          
          {/* LEFT: Ingestion Area */}
          <div className="flex-1 flex flex-col gap-6">
            {/* Tabs */}
            <div className="flex border-b border-slate-200 gap-4">
              <button 
                onClick={() => setActiveTab('upload')}
                className={`pb-3 px-2 text-sm font-bold border-b-2 transition-all ${activeTab === 'upload' ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
              >
                File Upload
              </button>
              <button 
                onClick={() => setActiveTab('text')}
                className={`pb-3 px-2 text-sm font-bold border-b-2 transition-all ${activeTab === 'text' ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
              >
                Raw Text Ingestion
              </button>
            </div>

            {/* Content Area */}
            <AnimatePresence mode="wait">
              {activeTab === 'upload' ? (
                <motion.div 
                  key="upload"
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  className="flex-1 flex flex-col gap-6"
                >
                  <div 
                    className="flex-1 border-2 border-dashed border-border-color rounded-[20px] bg-surface hover:border-primary hover:bg-primary/5 transition-all flex flex-col items-center justify-center p-8 cursor-pointer group min-h-[400px] shadow-sm hover:shadow-md"
                    onClick={() => setFile('CPI_Methodology_Update_2023.pdf')}
                  >
                    <div className="w-20 h-20 rounded-full bg-background flex items-center justify-center mb-6 group-hover:bg-surface group-hover:shadow-md transition-all group-hover:-translate-y-2">
                      <UploadCloud className="text-slate-400 group-hover:text-primary transition-colors" size={40} />
                    </div>
                    <h3 className="text-2xl font-extrabold text-slate-900 mb-2">Drag & Drop Documents</h3>
                    <p className="text-slate-500 text-center text-base max-w-sm mb-8 font-medium">Support for PDF, DOCX, and TXT files. Optimized for MoSPI technical circulars.</p>
                    <button className="bg-surface border-2 border-border-color text-slate-700 px-6 py-3 rounded-full text-sm font-bold group-hover:border-primary group-hover:text-primary transition-all shadow-sm active:scale-95">
                      Browse Files
                    </button>
                  </div>

                  {/* Mock File List */}
                  <AnimatePresence>
                    {file && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0, marginTop: -24 }} 
                        animate={{ opacity: 1, height: 'auto', marginTop: 0 }} 
                        exit={{ opacity: 0, height: 0, marginTop: -24 }}
                        className="bg-surface border border-green-200 rounded-[20px] p-2 shadow-sm overflow-hidden"
                      >
                        <div className="flex items-center justify-between p-4 rounded-xl hover:bg-background transition-colors">
                          <div className="flex items-center gap-4">
                            <div className="bg-red-50 p-3 rounded-full">
                              <FileText className="text-red-500" size={24} />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-base font-bold text-slate-900">{file}</span>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs font-bold text-slate-400">2.4 MB</span>
                                <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                <span className="text-xs font-bold text-green-600 flex items-center gap-1"><CheckCircle2 size={12}/> Processing Complete</span>
                              </div>
                            </div>
                          </div>
                          <button className="text-slate-400 hover:text-red-500 p-3 hover:bg-red-50 rounded-xl transition-all" onClick={(e) => { e.stopPropagation(); setFile(null); }}>
                            <Trash2 size={20} />
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ) : (
                <motion.div 
                  key="text"
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  className="flex-1 flex flex-col min-h-[400px]"
                >
                  <textarea 
                    value={sourceText}
                    onChange={(e) => setSourceText(e.target.value)}
                    className="w-full h-full p-6 border-2 border-border-color rounded-[20px] bg-surface text-base font-medium focus:border-primary focus:ring-4 focus:ring-primary/10 resize-none outline-none shadow-sm transition-all"
                    placeholder="Paste raw text, circular content, or syllabus guidelines here to generate a tailored assessment..."
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* RIGHT: Generation Console */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-full xl:w-[480px] shrink-0 bg-surface border border-border-color rounded-[20px] p-6 md:p-8 shadow-md flex flex-col relative overflow-hidden"
          >
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-background rounded-full blur-3xl pointer-events-none"></div>
            
            <div className="flex items-center gap-3 border-b border-border-color pb-6 mb-8 relative z-10">
              <div className="p-2.5 bg-accent/10 rounded-full text-accent">
                <Settings2 size={20} strokeWidth={2.5} />
              </div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Generation Console</h2>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200 mb-6 text-sm font-medium flex gap-2 items-start relative z-10">
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 mb-8 relative z-10">
              <div className="bg-background p-5 rounded-xl border border-border-color hover:border-slate-300 transition-colors">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Tokens Extracted</p>
                <p className="text-3xl font-extrabold text-slate-900">{file || sourceText.length > 0 ? '1,420' : '0'}</p>
              </div>
              <div className="bg-background p-5 rounded-xl border border-border-color hover:border-slate-300 transition-colors">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Est. Gen Time</p>
                <p className="text-3xl font-extrabold text-primary">{file || sourceText.length > 0 ? '~5s' : '--'}</p>
              </div>
            </div>

            <div className="flex flex-col gap-8 flex-1 relative z-10">
              {/* Dropdown */}
              <div className="flex flex-col gap-3">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Target FRAC Competency</label>
                <div className="relative">
                  <select className="w-full appearance-none bg-slate-50 border-2 border-slate-100 hover:border-slate-200 rounded-xl py-3.5 pl-4 pr-10 text-sm font-bold focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none text-slate-800 transition-all cursor-pointer">
                    <option>Statistical Analysis & Methodology</option>
                    <option>Data Collection Protocols</option>
                    <option>Quality Assurance Frameworks</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                </div>
              </div>

              {/* Slider 1 */}
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Number of Questions</label>
                  <span className="text-xs font-extrabold text-primary bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20">15 Qs</span>
                </div>
                <input type="range" min="5" max="30" defaultValue="15" className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-accent" />
              </div>

              {/* Slider 2 (Difficulty - pseudo segmented) */}
              <div className="flex flex-col gap-3">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Difficulty Distribution</label>
                <div className="flex h-12 rounded-xl overflow-hidden border-2 border-slate-100">
                  <div className="flex-1 flex items-center justify-center bg-white text-slate-500 text-sm font-bold border-r-2 border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors">Basic</div>
                  <div className="flex-1 flex items-center justify-center bg-accent text-white text-sm font-extrabold border-r-2 border-slate-100 cursor-pointer shadow-inner">Intermediate</div>
                  <div className="flex-1 flex items-center justify-center bg-white text-slate-500 text-sm font-bold cursor-pointer hover:bg-slate-50 transition-colors">Advanced</div>
                </div>
              </div>

              {/* Toggles */}
              <div className="flex flex-col gap-5 mt-2 pt-8 border-t border-slate-100">
                <label className="flex items-center justify-between cursor-pointer group">
                  <span className="text-sm font-bold text-slate-700 group-hover:text-slate-900 transition-colors">Generate Explanations</span>
                  <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-primary/20 group-hover:bg-primary/30 transition-colors">
                    <span className="inline-block h-5 w-5 translate-x-5 rounded-full bg-primary transition-transform shadow-sm" />
                  </div>
                </label>
                <label className="flex items-center justify-between cursor-pointer group">
                  <span className="text-sm font-bold text-slate-700 group-hover:text-slate-900 transition-colors">Include Distractor Analysis</span>
                  <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-primary/20 group-hover:bg-primary/30 transition-colors">
                    <span className="inline-block h-5 w-5 translate-x-5 rounded-full bg-primary transition-transform shadow-sm" />
                  </div>
                </label>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 mt-10 pt-6 border-t border-border-color relative z-10">
              <button className="flex-1 bg-surface border-2 border-border-color text-slate-700 py-3.5 rounded-full text-sm font-bold hover:bg-background hover:border-slate-300 transition-all flex items-center justify-center gap-2 active:scale-95">
                <Eye size={18} /> Preview JSON
              </button>
              <button 
                onClick={handleGenerate}
                disabled={generating || (!file && sourceText.length === 0)}
                className="flex-[2] bg-primary hover:bg-primary-light text-white py-3.5 rounded-full text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-50 disabled:shadow-none active:scale-95"
              >
                <Sparkles size={18} /> Generate Quiz
              </button>
            </div>
          </motion.div>
        </div>
        ) : viewState === 'curation' ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-6 flex-1 pb-10"
          >
            {/* Curation UI - HITL Editor */}
            <div className="bg-surface border border-border-color rounded-[20px] p-6 sm:p-8 shadow-sm">
              <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-8 pb-6 border-b border-border-color">
                <div className="flex-1">
                  <input 
                    type="text" 
                    value={assessmentMeta.title}
                    onChange={(e) => setAssessmentMeta(prev => ({...prev, title: e.target.value}))}
                    className="text-2xl font-extrabold text-slate-900 bg-transparent border-none p-0 focus:ring-0 w-full mb-1 outline-none hover:bg-slate-50 transition-colors rounded-lg"
                    placeholder="Assessment Title"
                  />
                  <p className="text-sm font-medium text-slate-500 flex items-center gap-2">
                    <Settings2 size={16} /> Human-in-the-Loop (HITL) Validation Mode
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <div className="flex items-center gap-2 bg-background border border-border-color rounded-full px-4 py-2 focus-within:border-primary transition-colors">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Target</span>
                    <input 
                      type="text" 
                      value={assessmentMeta.competency}
                      onChange={(e) => setAssessmentMeta(prev => ({...prev, competency: e.target.value}))}
                      className="text-sm font-bold text-slate-900 bg-transparent border-none p-0 focus:ring-0 outline-none w-32"
                    />
                  </div>
                  <div className="flex items-center gap-2 bg-background border border-border-color rounded-full px-4 py-2 focus-within:border-primary transition-colors">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Level</span>
                    <select 
                      value={assessmentMeta.difficulty}
                      onChange={(e) => setAssessmentMeta(prev => ({...prev, difficulty: e.target.value}))}
                      className="text-sm font-bold text-slate-900 bg-transparent border-none p-0 focus:ring-0 outline-none cursor-pointer appearance-none"
                    >
                      <option>Basic</option>
                      <option>Intermediate</option>
                      <option>Advanced</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col gap-8">
                {questions.map((q, idx) => (
                  <div key={q.id} className="rounded-[20px] p-6 md:p-8 transition-colors bg-surface border border-border-color shadow-sm hover:border-primary/30 group">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6 border-b border-border-color pb-4">
                      <div className="flex items-center gap-3">
                        <span className="bg-slate-900 text-white px-3 py-1 rounded-full text-sm font-bold">Q{idx + 1}</span>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-200">
                          <Sparkles size={12} /> AI Generated
                        </div>
                      </div>
                      
                      {/* Bulk Tagging / Taxonomy Inline */}
                      <div className="flex flex-wrap gap-2">
                        <div className="flex items-center bg-blue-50 border border-blue-100 rounded-full px-3 py-1.5 focus-within:ring-2 ring-blue-200 transition-shadow">
                           <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mr-2">Tag</span>
                           <input 
                             value={q.topic_tag}
                             onChange={(e) => {
                               const updated = [...questions];
                               updated[idx].topic_tag = e.target.value;
                               setQuestions(updated);
                             }}
                             className="text-xs font-bold text-blue-800 bg-transparent border-none p-0 outline-none w-28"
                           />
                        </div>
                        <div className="flex items-center bg-amber-50 border border-amber-100 rounded-full px-3 py-1.5 focus-within:ring-2 ring-amber-200 transition-shadow">
                           <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mr-2">Bloom's</span>
                           <select 
                             value={q.bloom_taxonomy_level}
                             onChange={(e) => {
                               const updated = [...questions];
                               updated[idx].bloom_taxonomy_level = e.target.value;
                               setQuestions(updated);
                             }}
                             className="text-xs font-bold text-amber-800 bg-transparent border-none p-0 outline-none cursor-pointer w-28 appearance-none"
                           >
                              <option>Recall (L1)</option>
                              <option>Application (L2)</option>
                              <option>Scenario (L3)</option>
                           </select>
                        </div>
                      </div>
                    </div>
                    
                    <textarea 
                      className="w-full bg-background border border-border-color rounded-xl p-4 text-lg font-extrabold text-slate-900 mb-6 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none resize-none transition-all leading-snug"
                      value={q.question_text}
                      onChange={(e) => {
                        const updated = [...questions];
                        updated[idx].question_text = e.target.value;
                        setQuestions(updated);
                      }}
                      rows={2}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      {q.options.map((opt, i) => (
                        <div key={i} className={`flex items-center gap-3 p-4 rounded-[20px] border-2 transition-all ${q.correct_option_index === i ? 'bg-primary/5 border-primary shadow-sm' : 'bg-surface border-border-color focus-within:border-slate-400'}`}>
                          <input 
                            type="radio" 
                            name={`q_${q.id}_ans`} 
                            checked={i === q.correct_option_index} 
                            onChange={() => {
                              const updated = [...questions];
                              updated[idx].correct_option_index = i;
                              setQuestions(updated);
                            }}
                            className="w-4 h-4 text-primary accent-primary cursor-pointer shrink-0" 
                          />
                          <textarea 
                            value={opt} 
                            onChange={(e) => {
                              const updated = [...questions];
                              updated[idx].options[i] = e.target.value;
                              setQuestions(updated);
                            }}
                            className="w-full text-sm font-bold text-slate-700 outline-none bg-transparent resize-none overflow-hidden" 
                            rows={1}
                          />
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-col gap-2 bg-background p-5 rounded-[20px] border border-border-color focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/10 transition-all">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText size={16} className="text-slate-500" />
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Official Methodology Justification</label>
                      </div>
                      <textarea 
                        className="w-full bg-transparent border-none p-0 text-sm font-medium text-slate-700 outline-none resize-none focus:ring-0 leading-relaxed"
                        value={q.explanation}
                        onChange={(e) => {
                          const updated = [...questions];
                          updated[idx].explanation = e.target.value;
                          setQuestions(updated);
                        }}
                        rows={2}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center gap-4 mt-10 pt-8 border-t border-border-color">
                <div className="text-sm font-bold text-slate-500 flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-green-500"/> All {questions.length} questions validated
                </div>
                <div className="flex gap-4">
                  <button 
                    onClick={() => setViewState('ingestion')}
                    className="px-6 py-3.5 bg-surface border border-border-color text-slate-700 rounded-full font-bold hover:bg-background transition-colors"
                  >
                    Back
                  </button>
                  <button 
                    onClick={handleSimulateQuiz}
                    className="px-8 py-3.5 bg-primary hover:bg-primary-light text-white rounded-full font-bold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-primary/20 active:scale-95"
                  >
                    <PlayCircle size={18} /> Simulate Learner View
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col flex-1 pb-10 max-w-4xl mx-auto w-full"
          >
            {/* Taking UI */}
            <div className="bg-surface border border-border-color rounded-[20px] p-6 sm:p-10 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-background">
                <div 
                  className="h-full bg-primary transition-all duration-300" 
                  style={{ width: `${((currentQIndex + 1) / questions.length) * 100}%` }}
                />
              </div>

              {!showResults ? (
                <>
                  <div className="mb-8">
                    <span className="text-xs font-bold text-primary uppercase tracking-widest mb-2 block">Question {currentQIndex + 1} of {questions.length}</span>
                    <h2 className="text-2xl font-extrabold text-slate-900 leading-snug">{questions[currentQIndex]?.question_text}</h2>
                  </div>

                  <div className="flex flex-col gap-3 mb-8">
                    {questions[currentQIndex]?.options.map((opt, i) => {
                      const isSelected = selectedAnswers[currentQIndex] === i;
                      return (
                        <button
                          key={i}
                          onClick={() => setSelectedAnswers(prev => ({ ...prev, [currentQIndex]: i }))}
                          className={`text-left p-4 rounded-[20px] border-2 transition-all ${
                            isSelected 
                              ? 'border-primary bg-primary/5 text-primary font-bold' 
                              : 'border-border-color bg-surface text-slate-700 hover:border-slate-300 hover:bg-background'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-primary' : 'border-slate-300'}`}>
                              {isSelected && <div className="w-2.5 h-2.5 bg-primary rounded-full" />}
                            </div>
                            {opt}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex justify-between items-center pt-6 border-t border-border-color">
                    <button 
                      onClick={() => setViewState('curation')}
                      className="text-slate-500 font-bold hover:text-slate-700 transition-colors px-4 py-2"
                    >
                      Exit Simulator
                    </button>
                    <button 
                      disabled={selectedAnswers[currentQIndex] === undefined}
                      onClick={() => {
                        if (currentQIndex < questions.length - 1) {
                          setCurrentQIndex(prev => prev + 1);
                        } else {
                          setShowResults(true);
                        }
                      }}
                      className="px-8 py-3.5 bg-primary hover:bg-primary-light text-white rounded-full font-bold transition-all disabled:opacity-50 active:scale-95 flex items-center gap-2 shadow-lg shadow-primary/20"
                    >
                      {currentQIndex < questions.length - 1 ? 'Next Question' : 'Submit Quiz'}
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center text-center py-8">
                  <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle2 size={48} className="text-green-600" />
                  </div>
                  <h2 className="text-4xl font-extrabold text-slate-900 mb-2">Quiz Complete!</h2>
                  <p className="text-lg text-slate-600 mb-8 font-medium">You scored <span className="font-bold text-primary">{calculateScore()}</span> out of {questions.length}</p>
                  
                  <div className="w-full text-left flex flex-col gap-6 mb-8">
                    {questions.map((q, i) => (
                      <div key={q.id} className="p-5 rounded-[20px] border border-border-color bg-background">
                        <p className="font-bold text-slate-900 mb-3">{i+1}. {q.question_text}</p>
                        <p className="text-sm font-medium mb-1">
                          <span className="text-slate-500">Your Answer:</span> 
                          <span className={selectedAnswers[i] === q.correct_option_index ? 'text-green-600 ml-2 font-bold' : 'text-red-600 ml-2 font-bold'}>
                            {q.options[selectedAnswers[i]]}
                          </span>
                        </p>
                        {selectedAnswers[i] !== q.correct_option_index && (
                          <p className="text-sm font-medium mb-2">
                            <span className="text-slate-500">Correct Answer:</span>
                            <span className="text-green-600 ml-2 font-bold">{q.options[q.correct_option_index]}</span>
                          </p>
                        )}
                        <div className="mt-3 p-3 bg-blue-50 text-blue-800 text-xs font-semibold rounded-lg border border-blue-100">
                          {q.explanation}
                        </div>
                      </div>
                    ))}
                  </div>

                  <button 
                    onClick={() => setViewState('curation')}
                    className="px-8 py-3.5 bg-primary hover:bg-primary-light text-white rounded-full font-bold transition-all shadow-lg shadow-primary/20 active:scale-95"
                  >
                    Back to Curation
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
