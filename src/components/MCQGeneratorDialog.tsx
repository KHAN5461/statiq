import React, { useState } from 'react';
import { 
  X,
  UploadCloud, 
  Settings2, 
  Sparkles,
  FileText,
  CheckCircle2,
  Loader2,
  Trash2,
  AlertCircle,
  RefreshCw,
  Save,
  Send,
  PlayCircle,
  Edit3,
  AlignLeft,
  Target,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Material3Skeleton } from './Material3Skeleton';
import { ViewState } from '../types';
import { useNavigate } from 'react-router-dom';

interface MCQGeneratorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onPublishSuccess?: (assessment: any) => void;
}

const generationSteps = [
  "Initializing LLM Engine...",
  "Extracting tokens from document...",
  "Mapping context to FRAC taxonomy...",
  "Generating distractor options...",
  "Finalizing JSON Assessment..."
];

export function MCQGeneratorDialog({ isOpen, onClose, onPublishSuccess }: MCQGeneratorDialogProps) {
  const navigate = useNavigate();
  const [viewState, setViewState] = useState<'ingestion' | 'trainer'>('ingestion');
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<string | null>(null);
  const [inputText, setInputText] = useState<string>(
    `As per the National Sample Survey Office (NSSO) guidelines, the sampling frame for rural areas is usually the list of villages as per the latest Population Census. However, whenever the population of a sample First Stage Unit (FSU) exceeds 1200, it is to be divided into a suitable number of hamlet-groups to manage the listing workload. The Data Digital Personal Data Protection Act 2023 mandates that personal data of survey respondents must be anonymized before storage.`
  );
  
  // Generation Parameters
  const [totalQuestions, setTotalQuestions] = useState(10);
  const [bloomL1, setBloomL1] = useState(true);
  const [bloomL2, setBloomL2] = useState(true);
  const [bloomL3, setBloomL3] = useState(false);
  const [competencyTag, setCompetencyTag] = useState('Sampling Methods');

  const [generating, setGenerating] = useState(false);
  const [genStep, setGenStep] = useState(0);
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
  const [generatedAssessment, setGeneratedAssessment] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [draftQuestions, setDraftQuestions] = useState<any[]>([
    {
      id: 1,
      text: "According to the NSSO manual, which of the following sampling frames is generally used for the first-stage selection of villages in a rural stratum?",
      options: [
        "Population Census villages",
        "Economic Census blocks",
        "Urban Frame Survey blocks",
        "Voter registration lists"
      ],
      correctIndex: 0,
      explanation: "NSSO primarily uses Population Census villages as the First Stage Units (FSUs) in rural areas.",
      bloom: "Recall L1",
      source: "...the sampling frame for rural areas is usually the list of villages as per the latest Population Census..."
    },
    {
      id: 2,
      text: "If a selected FSU has a population exceeding 1200, what is the standard procedure to manage the workload?",
      options: [
        "Survey the entire FSU",
        "Divide the FSU into smaller hamlet-groups (hgs)",
        "Select an alternative FSU",
        "Only survey households with >5 members"
      ],
      correctIndex: 1,
      explanation: "Large FSUs are divided into hamlet-groups to restrict the listing workload.",
      bloom: "Application L2",
      source: "...whenever the population of a sample FSU exceeds 1200, it is to be divided into a suitable number of hamlet-groups..."
    }
  ]);

  if (!isOpen) return null;

  const handleFileDropOrSelect = (f: File) => {
    setFile(f.name);
    setError(null);
    if (f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        const base64 = result.split(',')[1];
        setPdfBase64(base64);
        setInputText(`[PDF Document: ${f.name} (${Math.round(f.size / 1024)} KB) uploaded. MoSPI Intelligence Engine will process this binary PDF directly using its native document vision capability.]`);
      };
      reader.onerror = () => {
        setError("Failed to read the PDF file.");
      };
      reader.readAsDataURL(f);
    } else {
      setPdfBase64(null);
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setInputText(content || '');
      };
      reader.onerror = () => {
        setError("Failed to read the file.");
      };
      reader.readAsText(f);
    }
  };

  const handleGenerate = async () => {
    if (!inputText.trim()) {
      alert("Please upload a document or paste some MoSPI text corpus first.");
      return;
    }
    
    setGenerating(true);
    setGenStep(0);
    setError(null);
    
    const stepInterval = setInterval(() => {
      setGenStep(prev => Math.min(prev + 1, generationSteps.length - 2));
    }, 1200);

    try {
      const response = await fetch("/api/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          sourceText: pdfBase64 ? "" : inputText,
          pdfBase64,
          totalQuestions,
          bloomL1,
          bloomL2,
          bloomL3,
          competencyTag
        }),
      });

      if (!response.ok) {
        let errMsg = "API failed";
        try {
          const errData = await response.json();
          errMsg = errData.message || errData.error || errMsg;
        } catch (_) {}
        throw new Error(errMsg);
      }

      const data = await response.json();
      setGeneratedAssessment(data);
      
      const flattened: any[] = [];
      if (data.questions && Array.isArray(data.questions)) {
        let questionCounter = 1;
        data.questions.forEach((q: any) => {
          flattened.push({
            id: questionCounter++,
            text: q.question_text || q.prompt || q.text,
            options: q.options || [],
            correctIndex: q.correct_option_index ?? q.correct_index ?? q.correctIndex ?? 0,
            explanation: q.explanation || q.rationale || '',
            bloom: q.bloom_level || q.bloom || 'L2: Application',
            section_name: q.topic_tag ? `${q.topic_tag} Competency Module` : 'Assessment Questions',
            section_type: q.data_table_markdown ? 'data_interpretation_caselet' : 'standard_mcq',
            data_table_markdown: q.data_table_markdown || ''
          });
        });
      } else if (data.sections && Array.isArray(data.sections)) {
        let questionCounter = 1;
        data.sections.forEach((sec: any) => {
          if (sec.questions && Array.isArray(sec.questions)) {
            sec.questions.forEach((q: any) => {
              flattened.push({
                id: questionCounter++,
                text: q.prompt || q.text,
                options: q.options,
                correctIndex: q.correct_index ?? q.correctIndex ?? 0,
                explanation: q.explanation || q.rationale || '',
                bloom: q.bloom_level || q.bloom || 'Recall',
                section_name: sec.section_name,
                section_type: sec.type,
                data_table_markdown: sec.data_table_markdown || ''
              });
            });
          }
        });
      }

      setDraftQuestions(flattened);
      
      clearInterval(stepInterval);
      setGenStep(generationSteps.length - 1);
      setTimeout(() => {
        setGenerating(false);
        setViewState('trainer');
      }, 800);
      
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Please check your network connection and try again.");
      clearInterval(stepInterval);
      setGenerating(false);
    }
  };

  const reconstructSections = (questions: any[]) => {
    const sectionsMap = new Map<string, any>();
    questions.forEach(q => {
      const sName = q.section_name || "General MCQs";
      const sType = q.section_type || "standard_mcq";
      const sTable = q.data_table_markdown || "";
      
      if (!sectionsMap.has(sName)) {
        sectionsMap.set(sName, {
          section_name: sName,
          type: sType,
          data_table_markdown: sTable,
          questions: []
        });
      }
      
      sectionsMap.get(sName).questions.push({
        id: q.id ? `q-${q.id}` : `q-${Math.random().toString(36).substr(2, 6)}`,
        bloom_level: q.bloom || "Recall",
        prompt: q.text || q.prompt,
        options: q.options,
        correct_index: q.correctIndex ?? 0,
        explanation: q.explanation || ""
      });
    });
    return Array.from(sectionsMap.values());
  };

  const handlePublish = async () => {
    try {
      const titleToUse = generatedAssessment?.title || (competencyTag + ' Assessment');
      const docRef = await addDoc(collection(db, 'assessments'), {
        title: titleToUse,
        description: 'Auto-generated assessment for ' + (generatedAssessment?.target_domain || competencyTag),
        createdBy: auth.currentUser?.uid || 'anonymous',
        createdAt: serverTimestamp(),
        questions: draftQuestions,
        sections: reconstructSections(draftQuestions),
        assessment_id: generatedAssessment?.assessment_id || `ASMT-${Date.now()}`,
        target_cadre: generatedAssessment?.target_cadre || ["JSO", "SSO"],
        target_domain: generatedAssessment?.target_domain || competencyTag,
        passing_criteria_pct: generatedAssessment?.passing_criteria_pct || 70,
        cohort: 'All Cohorts',
        status: 'Published'
      });
      
      alert("Assessment published successfully!");
      if (onPublishSuccess) {
        onPublishSuccess(generatedAssessment);
      }
      onClose();
    } catch (error) {
      console.error("Error publishing:", error);
      alert("Failed to publish assessment.");
    }
  };

  const updateDraftQuestion = (index: number, field: string, value: any) => {
    const newQs = [...draftQuestions];
    if (field === 'options') {
      newQs[index].options = value;
    } else {
      (newQs[index] as any)[field] = value;
    }
    setDraftQuestions(newQs);
  };

  const updateOption = (qIndex: number, optIndex: number, value: string) => {
    const newQs = [...draftQuestions];
    newQs[qIndex].options[optIndex] = value;
    setDraftQuestions(newQs);
  };

  const handleTestRun = async () => {
    try {
      const activeObj = {
        title: `${competencyTag} Assessment (Draft)`,
        description: 'Auto-generated draft assessment.',
        questions: draftQuestions,
        createdBy: auth.currentUser?.uid || 'system',
        createdAt: serverTimestamp(),
        cohort: 'Unassigned',
        target_zone: 'Unassigned',
        status: 'Draft'
      };
      const docRef = await addDoc(collection(db, 'assessments'), activeObj);
      navigate('/assessment/' + docRef.id);
      onClose();
    } catch (error) {
      console.error("Error creating draft test:", error);
      alert("Failed to start test run.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-hidden">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={() => {
          if (viewState === 'trainer' && window.confirm("Are you sure you want to close? Your edits will be lost.")) {
            onClose();
          } else if (viewState === 'ingestion' && !generating) {
            onClose();
          }
        }}
      />

      {/* Dialog container */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ type: "spring", damping: 25, stiffness: 350 }}
        className="bg-white dark:bg-slate-900 w-full max-w-6xl h-[90vh] rounded-xl shadow-2xl flex flex-col relative z-10 border border-slate-200 dark:border-slate-800 overflow-hidden font-sans"
      >
        {/* Header */}
        <header className="flex justify-between items-center px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/20 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/40 text-blue-900 dark:text-blue-100 flex items-center justify-center">
              <Sparkles size={20} className="animate-pulse text-blue-900 dark:text-blue-200" />
            </div>
            <div>
              <h2 className="font-extrabold text-lg text-slate-900 dark:text-slate-100 leading-tight">
                {viewState === 'ingestion' ? 'AI Assessment Generator' : 'Trainer Mode: QA Editor'}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {viewState === 'ingestion' ? 'Draft custom multiple-choice assessments powered by Gemini 3.8' : 'Review and polish generated questions before deploying.'}
              </p>
            </div>
          </div>
          <button 
            onClick={() => {
              if (viewState === 'trainer' && window.confirm("Are you sure you want to close? Your edits will be lost.")) {
                onClose();
              } else if (viewState === 'ingestion' && !generating) {
                onClose();
              }
            }}
            className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors focus:ring-2 focus:ring-blue-900"
          >
            <X size={20} />
          </button>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          
          {generating ? (
            <div className="flex flex-col lg:flex-row gap-8 flex-1 min-h-0 overflow-y-auto items-stretch justify-center py-10">
              {/* Left side: Shimmering Skeleton of generated assessment */}
              <div className="flex-1 bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 rounded-xl p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
                  <span className="text-xs font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-widest">
                    Real-time Generation Pipeline Active
                  </span>
                </div>
                <Material3Skeleton />
              </div>
              
              {/* Right side: Realtime Step-by-Step progress indicator */}
              <div className="lg:w-80 shrink-0 bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-col gap-6">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
                  <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/40 rounded-xl flex items-center justify-center text-blue-900 dark:text-blue-200 relative">
                    <Loader2 size={20} className="animate-spin" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">AI Ingestion</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Processing MoSPI Corpus</p>
                  </div>
                </div>

                {/* Progress Steps List */}
                <div className="space-y-4">
                  {generationSteps.map((step, idx) => {
                    const isCompleted = idx < genStep;
                    const isActive = idx === genStep;
                    return (
                      <div key={idx} className="flex items-start gap-3">
                        <div className="mt-0.5 shrink-0">
                          {isCompleted ? (
                            <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold">
                              ✓
                            </div>
                          ) : isActive ? (
                            <div className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] font-bold animate-pulse">
                              ●
                            </div>
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-400 flex items-center justify-center text-[10px] font-bold">
                              {idx + 1}
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className={`text-xs font-bold ${isActive ? 'text-amber-600 dark:text-amber-400' : isCompleted ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400'}`}>
                            {step}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-2 bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-blue-900"
                    initial={{ width: '0%' }}
                    animate={{ width: `${((genStep + 1) / generationSteps.length) * 100}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>
            </div>
          ) : viewState === 'ingestion' ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
              {/* Left: Drag & Drop + Text Editor */}
              <div className="lg:col-span-7 flex flex-col gap-4 min-h-0">
                {/* Drag & Drop */}
                <div 
                  className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center transition-all min-h-[140px] shrink-0
                    ${dragActive ? 'border-blue-900 bg-blue-50/20' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}
                    ${error ? 'border-red-400 bg-red-50/10 dark:bg-red-950/5' : file ? 'border-emerald-400 bg-emerald-50/30' : ''}
                  `}
                  onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragActive(false);
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      handleFileDropOrSelect(e.dataTransfer.files[0]);
                    }
                  }}
                >
                  {error ? (
                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center max-w-md px-4">
                      <div className="w-10 h-10 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-xl flex items-center justify-center mb-1.5 border border-red-200 dark:border-red-900/30 shadow-sm">
                        <AlertCircle size={20} />
                      </div>
                      <h3 className="text-xs font-bold text-red-600 dark:text-red-400 mb-0.5">Generation Process Failed</h3>
                      <p className="text-slate-600 dark:text-slate-400 text-[11px] mb-3 leading-relaxed font-semibold">
                        {error}
                      </p>
                      <div className="flex gap-2">
                        <button 
                          onClick={handleGenerate} 
                          className="bg-red-600 hover:bg-red-700 text-white dark:bg-red-500/20 dark:hover:bg-red-500/30 dark:text-red-300 border border-transparent dark:border-red-500/30 px-3 py-1.5 rounded-full font-bold text-[10px] flex items-center gap-1 transition-all shadow-sm cursor-pointer"
                        >
                          <RefreshCw size={10} /> Retry Generation
                        </button>
                        <button 
                          onClick={() => { setFile(null); setInputText(''); setPdfBase64(null); setError(null); }} 
                          className="bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-full font-bold text-[10px] flex items-center gap-1 transition-all cursor-pointer"
                        >
                          <Trash2 size={10} /> Reset File
                        </button>
                      </div>
                    </motion.div>
                  ) : file ? (
                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center">
                      <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center mb-2 border border-emerald-200 shadow-sm">
                        <CheckCircle2 size={20} />
                      </div>
                      <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 mb-0.5">Extracted Document Text</h3>
                      <p className="text-slate-600 dark:text-slate-400 font-mono text-[11px] mb-2 font-semibold">{file}</p>
                      <button 
                        onClick={() => { setFile(null); setInputText(''); setPdfBase64(null); setError(null); }} 
                        className="text-red-500 hover:text-red-700 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Trash2 size={12} /> Clear and Reset
                      </button>
                    </motion.div>
                  ) : (
                    <>
                      <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-900 dark:text-blue-200 mb-2 shadow-inner">
                        <UploadCloud size={20} />
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-0.5 tracking-tight">Upload guidelines or circular files</h3>
                      <p className="text-slate-500 dark:text-slate-400 text-[11px] max-w-sm mb-3 font-medium">
                        Supports PDF, TXT, CSV, or MD files. Drag & drop or browse.
                      </p>
                      <label className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 hover:border-blue-900 text-slate-700 dark:text-slate-200 hover:text-blue-900 px-5 py-1.5 rounded-full font-bold text-xs cursor-pointer shadow-sm transition-all active:scale-95">
                        Browse Files
                        <input type="file" className="hidden" onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleFileDropOrSelect(e.target.files[0]);
                          }
                        }} />
                      </label>
                    </>
                  )}
                </div>

                {/* Text Editor */}
                {!file && (
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm flex flex-col gap-2 flex-1 min-h-[180px]">
                    <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-2">
                      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <FileText size={12} className="text-blue-900 dark:text-blue-200"/> Input guidelines text corpus
                      </label>
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                        {inputText.length} characters
                      </span>
                    </div>
                    <textarea
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder="Paste or type MoSPI guidelines, circulars, or rules directly here to generate MCQs..."
                      className="w-full flex-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 outline-none focus:border-blue-900 focus:ring-2 focus:ring-blue-900/15 resize-none leading-relaxed"
                    />
                  </div>
                )}
              </div>

              {/* Right: Parameters */}
              <div className="lg:col-span-5 bg-slate-50 dark:bg-slate-950/20 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm flex flex-col h-fit">
                <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">
                  <div className="p-1.5 bg-blue-50 dark:bg-blue-900/40 rounded-lg text-blue-900 dark:text-blue-200">
                    <Settings2 size={16} strokeWidth={2.5} />
                  </div>
                  <h2 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">Generation Parameters</h2>
                </div>
                
                <div className="space-y-5">
                  <div>
                    <label className="flex justify-between items-center mb-2">
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Question Count</span>
                      <span className="text-blue-900 dark:text-blue-200 font-bold text-xs">{totalQuestions} Questions</span>
                    </label>
                    <input 
                      type="range" min="5" max="30" step="5" 
                      value={totalQuestions} 
                      onChange={e => setTotalQuestions(Number(e.target.value))}
                      className="w-full accent-blue-900"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 block">Bloom's Taxonomy Distribution</label>
                    <div className="flex flex-col gap-2 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                      <label className="flex items-center gap-2.5 cursor-pointer">
                        <input type="checkbox" checked={bloomL1} onChange={e => setBloomL1(e.target.checked)} className="w-3.5 h-3.5 text-blue-900 rounded border-slate-300 focus:ring-blue-900" />
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Recall (L1) - Basic Facts</span>
                      </label>
                      <label className="flex items-center gap-2.5 cursor-pointer">
                        <input type="checkbox" checked={bloomL2} onChange={e => setBloomL2(e.target.checked)} className="w-3.5 h-3.5 text-blue-900 rounded border-slate-300 focus:ring-blue-900" />
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Application (L2) - Procedures</span>
                      </label>
                      <label className="flex items-center gap-2.5 cursor-pointer">
                        <input type="checkbox" checked={bloomL3} onChange={e => setBloomL3(e.target.checked)} className="w-3.5 h-3.5 text-blue-900 rounded border-slate-300 focus:ring-blue-900" />
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Scenario (L3) - Field Adjustments</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 block">FRAC Competency Tag</label>
                    <select value={competencyTag} onChange={e => setCompetencyTag(e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 outline-none focus:border-blue-900">
                      <option>Sampling Methods</option>
                      <option>National Accounts</option>
                      <option>Survey Design</option>
                      <option>Data Quality</option>
                    </select>
                  </div>

                  <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex gap-3">
                    <button 
                      onClick={onClose}
                      className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold py-2.5 rounded-full text-xs hover:bg-slate-50 transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleGenerate}
                      className="flex-[2] bg-blue-900 hover:bg-blue-800 text-white font-bold py-2.5 rounded-full shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Sparkles size={14}/> Generate Quiz
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Trainer Mode QA Editor in Dialog */
            <div className="flex-1 flex flex-col gap-4 min-h-0">
              {/* Action Ribbon inside dialog */}
              <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 px-4 py-3 rounded-xl flex flex-col sm:flex-row justify-between items-center gap-3 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  <p className="text-xs font-bold text-emerald-800 dark:text-emerald-400">
                    Generated {draftQuestions.length} multiple-choice questions successfully.
                  </p>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button 
                    onClick={handleTestRun}
                    className="px-4 py-1.5 bg-white dark:bg-slate-800 border border-amber-500/50 text-amber-700 dark:text-amber-400 rounded-full text-xs font-bold hover:bg-amber-50 transition-colors flex items-center gap-1.5 cursor-pointer justify-center"
                  >
                    <PlayCircle size={14}/> Test Run
                  </button>
                  <button 
                    onClick={handlePublish}
                    className="px-5 py-1.5 bg-blue-900 hover:bg-blue-800 text-white rounded-full text-xs font-bold shadow-sm hover:shadow transition-colors flex items-center gap-1.5 cursor-pointer justify-center"
                  >
                    <Send size={14}/> Publish Assessment
                  </button>
                </div>
              </div>

              {/* Scrollable Questions list inside dialog */}
              <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                {draftQuestions.map((q, qIndex) => (
                  <div key={q.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm flex flex-col lg:flex-row gap-5">
                    
                    {/* Editing side */}
                    <div className="lg:w-3/5 flex flex-col gap-4">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full text-[10px] font-bold uppercase tracking-wider">
                          Q{q.id}
                        </span>
                        <span className="px-2.5 py-0.5 bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                          <Target size={10}/> {q.bloom}
                        </span>
                      </div>
                      
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1"><Edit3 size={10}/> Question Text</label>
                        <textarea 
                          value={q.text} 
                          onChange={(e) => updateDraftQuestion(qIndex, 'text', e.target.value)}
                          className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100 focus:border-blue-900 focus:ring-1 focus:ring-blue-900 resize-none min-h-[60px]"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Distractor Options (Mark correct bubble)</label>
                        <div className="flex flex-col gap-2">
                          {q.options.map((opt: string, optIndex: number) => (
                            <div key={optIndex} className="flex items-center gap-2">
                              <button 
                                onClick={() => updateDraftQuestion(qIndex, 'correctIndex', optIndex)}
                                className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 cursor-pointer ${q.correctIndex === optIndex ? 'border-emerald-500 bg-emerald-50' : 'border-slate-300'}`}
                              >
                                {q.correctIndex === optIndex && <div className="w-2 h-2 bg-emerald-500 rounded-full"/>}
                              </button>
                              <input 
                                value={opt}
                                onChange={(e) => updateOption(qIndex, optIndex, e.target.value)}
                                className={`flex-1 bg-white dark:bg-slate-950 border p-2 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 ${q.correctIndex === optIndex ? 'border-emerald-300 text-emerald-900 dark:text-emerald-300 font-bold bg-emerald-50/10' : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'}`}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Rationale and grounding side */}
                    <div className="lg:w-2/5 bg-slate-50 dark:bg-slate-950/20 p-4 rounded-xl flex flex-col gap-4">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1"><AlignLeft size={10}/> Explanation Rationale</label>
                        <textarea 
                          value={q.explanation} 
                          onChange={(e) => updateDraftQuestion(qIndex, 'explanation', e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 focus:border-blue-900 resize-none min-h-[80px]"
                        />
                      </div>

                      <div className="bg-amber-50/30 dark:bg-amber-950/10 border border-amber-100 dark:border-amber-900/30 rounded-lg p-3 flex-1">
                        <label className="text-[9px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-1 flex items-center gap-1"><FileText size={10}/> Grounding Source</label>
                        <p className="text-[11px] font-mono text-slate-600 dark:text-slate-400 leading-relaxed italic">
                          "{q.source}"
                        </p>
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </motion.div>
    </div>
  );
}
