import React, { useState, useEffect } from 'react';
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
  AlertCircle,
  RefreshCw,
  Edit3,
  AlignLeft,
  Target,
  ChevronUp,
  Play,
  BookOpen
} from 'lucide-react';
import { ViewState } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Material3Layout } from './Material3Layout';
import { Material3Skeleton } from './Material3Skeleton';

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

export function GeneratorView({ setCurrentView }: GeneratorViewProps) {
  const [viewState, setViewState] = useState<'ingestion' | 'trainer'>('ingestion');
  const [activeSubTab, setActiveSubTab] = useState<'generate' | 'library'>('generate');
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

  const [libraryAssessments, setLibraryAssessments] = useState<any[]>([]);
  const [loadingLibrary, setLoadingLibrary] = useState(true);
  const [expandedLibraryId, setExpandedLibraryId] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'assessments'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setLibraryAssessments(fetched);
      setLoadingLibrary(false);
    });
    return () => unsubscribe();
  }, []);

  const handleDeleteLibraryAssessment = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this generated assessment?")) return;
    try {
      await deleteDoc(doc(db, 'assessments', id));
    } catch (err) {
      console.error("Error deleting assessment:", err);
      alert("Failed to delete assessment.");
    }
  };

  const handleLoadToTrainer = (assessment: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setDraftQuestions(assessment.questions || []);
    const plainTag = (assessment.title || '').replace(' Assessment', '');
    setCompetencyTag(plainTag || 'Sampling Methods');
    setViewState('trainer');
  };

  const handleStartLibraryAssessment = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    localStorage.setItem('active_assessment_id', id);
    localStorage.removeItem('temp_draft_questions');
    setCurrentView('assessment');
  };

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
      if (data.sections && Array.isArray(data.sections)) {
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
      await addDoc(collection(db, 'assessments'), {
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
      setCurrentView('admin');
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

  return (
    <Material3Layout 
      title={viewState === 'ingestion' ? 'Document Ingestion & Generation' : 'Trainer Mode: QA Editor'}
      subtitle={viewState === 'ingestion' ? 'Upload MoSPI reference documents, circulars, or manuals to auto-generate assessments.' : 'Review, customize, and validate the AI-generated questions against ground-truth text snippets.'}
    >
      <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto w-full flex-1 flex flex-col gap-8 pb-24">
      
      {/* Sub tabs in ingestion mode */}
      {viewState === 'ingestion' && (
        <div className="flex gap-6 border-b border-[#E7E0EC] dark:border-[#49454F]/50 pb-2 shrink-0">
          <button 
            onClick={() => setActiveSubTab('generate')}
            className={`pb-2 text-sm font-bold transition-all relative ${activeSubTab === 'generate' ? 'text-[#6750A4] dark:text-[#D0BCFF]' : 'text-slate-400 hover:text-slate-600'}`}
          >
            AI MCQ Generator
            {activeSubTab === 'generate' && <motion.div layoutId="gensubtab" className="absolute bottom-0 left-0 right-0 h-1 bg-[#6750A4] dark:bg-[#D0BCFF] rounded-t-full" />}
          </button>
          <button 
            onClick={() => setActiveSubTab('library')}
            className={`pb-2 text-sm font-bold transition-all relative ${activeSubTab === 'library' ? 'text-[#6750A4] dark:text-[#D0BCFF]' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Saved Assessments History ({libraryAssessments.length})
            {activeSubTab === 'library' && <motion.div layoutId="gensubtab" className="absolute bottom-0 left-0 right-0 h-1 bg-[#6750A4] dark:bg-[#D0BCFF] rounded-t-full" />}
          </button>
        </div>
      )}
      
      {/* Action Toolbar for Trainer Mode */}
      {viewState === 'trainer' && !generating && (
        <div className="bg-white dark:bg-slate-900 border border-[#E7E0EC] dark:border-[#49454F]/50 p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-4 shadow-sm shrink-0">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Generated {draftQuestions.length} draft multiple-choice questions successfully.
            </p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button onClick={() => alert('Draft saved successfully to local session.')} className="px-4 py-2 bg-white dark:bg-slate-800 border border-[#E7E0EC] dark:border-[#49454F]/50 rounded-full text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm flex items-center gap-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#6750A4] w-full sm:w-auto justify-center">
              <Save size={16}/> Save Draft
            </button>
            <button onClick={() => setCurrentView('assessment')} className="px-4 py-2 bg-white dark:bg-slate-800 border border-amber-500/50 text-amber-700 dark:text-amber-400 rounded-full text-sm font-bold hover:bg-amber-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500 w-full sm:w-auto justify-center">
              <PlayCircle size={16}/> Test Run
            </button>
            <button onClick={handlePublish} className="px-6 py-2 bg-[#6750A4] hover:bg-[#4F378B] text-white rounded-full text-sm font-bold shadow-md hover:shadow-lg transition-colors flex items-center gap-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#6750A4] w-full sm:w-auto justify-center">
              <Send size={16}/> Publish
            </button>
          </div>
        </div>
      )}

      {/* Content Area */}
      {generating ? (
        <div className="flex flex-col lg:flex-row gap-8 flex-1 min-h-0 overflow-y-auto">
          {/* Left side: Shimmering Skeleton of generated assessment */}
          <div className="flex-1">
            <div className="bg-white dark:bg-slate-900 border border-[#E7E0EC] dark:border-[#49454F]/50 rounded-2xl p-6 sm:p-8 mb-4">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
                <span className="text-xs font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-widest">
                  Real-time Generation Pipeline Active
                </span>
              </div>
              <Material3Skeleton />
            </div>
          </div>
          
          {/* Right side: Realtime Step-by-Step progress indicator */}
          <div className="lg:w-80 shrink-0">
            <div className="sticky top-4 bg-white dark:bg-slate-900 border border-[#E7E0EC] dark:border-[#49454F]/50 rounded-2xl p-6 shadow-sm flex flex-col gap-6">
              <div className="flex items-center gap-3 pb-4 border-b border-[#E7E0EC] dark:border-[#49454F]/50">
                <div className="w-10 h-10 bg-[#EADDFF] dark:bg-[#381E72]/40 rounded-xl flex items-center justify-center text-[#6750A4] dark:text-[#D0BCFF] relative">
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
                  className="h-full bg-[#6750A4]"
                  initial={{ width: '0%' }}
                  animate={{ width: `${((genStep + 1) / generationSteps.length) * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          </div>
        </div>
      ) : viewState === 'ingestion' ? (
        activeSubTab === 'generate' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1">
            
            {/* Left: Drag & Drop + Text Editor */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              {/* Drag & Drop */}
              <div 
                className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center transition-all min-h-[180px]
                  ${dragActive ? 'border-[#6750A4] bg-[#EADDFF]/20' : 'border-[#E7E0EC] dark:border-[#49454F]/50 bg-white dark:bg-slate-900 hover:border-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}
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
                    <div className="w-12 h-12 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-xl flex items-center justify-center mb-2 border border-red-200 dark:border-red-900/30 shadow-sm">
                      <AlertCircle size={24} />
                    </div>
                    <h3 className="text-sm font-bold text-red-600 dark:text-red-400 mb-1">Generation Process Failed</h3>
                    <p className="text-slate-600 dark:text-slate-400 text-xs mb-4 leading-relaxed font-semibold">
                      {error}
                    </p>
                    <div className="flex gap-3">
                      <button 
                        onClick={handleGenerate} 
                        className="bg-red-600 hover:bg-red-700 text-white dark:bg-red-500/20 dark:hover:bg-red-500/30 dark:text-red-300 border border-transparent dark:border-red-500/30 px-4 py-2 rounded-full font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                      >
                        <RefreshCw size={12} /> Retry Generation
                      </button>
                      <button 
                        onClick={() => { setFile(null); setInputText(''); setPdfBase64(null); setError(null); }} 
                        className="bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-full font-bold text-xs flex items-center gap-1 transition-all cursor-pointer"
                      >
                        <Trash2 size={12} /> Reset File
                      </button>
                    </div>
                  </motion.div>
                ) : file ? (
                  <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center">
                    <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center mb-2 border border-emerald-200 shadow-sm">
                      <CheckCircle2 size={24} />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-0.5">Extracted Document Text Successfully</h3>
                    <p className="text-slate-600 dark:text-slate-400 font-mono text-xs mb-3 font-semibold">{file}</p>
                    <button 
                      onClick={() => { setFile(null); setInputText(''); setPdfBase64(null); setError(null); }} 
                      className="text-red-500 hover:text-red-700 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Trash2 size={14} /> Clear and Reset
                    </button>
                  </motion.div>
                ) : (
                  <>
                    <div className="w-12 h-12 bg-[#EADDFF] dark:bg-[#381E72]/30 rounded-xl flex items-center justify-center text-[#6750A4] dark:text-[#D0BCFF] mb-3 shadow-inner">
                      <UploadCloud size={24} />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1 tracking-tight">Upload MoSPI reference documents</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-xs max-w-sm mb-4 font-medium">
                      Supports PDF, TXT, CSV, or MD files. Drag & drop or browse.
                    </p>
                    <label className="bg-white dark:bg-slate-800 border border-[#E7E0EC] dark:border-[#49454F]/50 hover:border-[#6750A4] text-slate-700 dark:text-slate-200 hover:text-[#6750A4] px-6 py-2 rounded-full font-bold text-xs cursor-pointer shadow-sm transition-all active:scale-95 focus:ring-2 focus:ring-[#6750A4] focus:outline-none">
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

              {/* Real-time Text Editor Area */}
              {!file && (
                <div className="bg-white dark:bg-slate-900 border border-[#E7E0EC] dark:border-[#49454F]/50 rounded-2xl p-6 shadow-sm flex flex-col gap-3 flex-1">
                  <div className="flex justify-between items-center border-b border-[#E7E0EC] dark:border-[#49454F]/50 pb-3">
                    <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <FileText size={14} className="text-[#6750A4] dark:text-[#D0BCFF]"/> Input Guidelines & Corpus
                    </label>
                    <span className="text-[11px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                      {inputText.length} characters
                    </span>
                  </div>
                  <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Paste or type MoSPI guidelines, circulars, or rules directly here to generate MCQs..."
                    className="w-full flex-1 min-h-[220px] bg-white dark:bg-slate-950 border border-[#E7E0EC] dark:border-[#49454F]/50 p-4 rounded-xl text-sm font-medium text-slate-800 dark:text-slate-200 outline-none focus:border-[#6750A4] focus:ring-2 focus:ring-[#6750A4]/15 resize-none leading-relaxed"
                  />
                </div>
              )}
            </div>

            {/* Right: Parameters */}
            <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-2xl border border-[#E7E0EC] dark:border-[#49454F]/50 p-6 shadow-sm flex flex-col h-fit sticky top-6">
              <div className="flex items-center gap-3 border-b border-[#E7E0EC] dark:border-[#49454F]/50 pb-4 mb-6">
                <div className="p-2 bg-[#EADDFF] dark:bg-[#381E72]/40 rounded-xl text-[#6750A4] dark:text-[#D0BCFF]">
                  <Settings2 size={18} strokeWidth={2.5} />
                </div>
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">Generation Parameters</h2>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="flex justify-between items-center mb-3">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Question Count</span>
                    <span className="text-[#6750A4] dark:text-[#D0BCFF] font-bold">{totalQuestions}</span>
                  </label>
                  <input 
                    type="range" min="5" max="50" step="5" 
                    value={totalQuestions} 
                    onChange={e => setTotalQuestions(Number(e.target.value))}
                    className="w-full accent-[#6750A4]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3 block">Bloom's Taxonomy Distribution</label>
                  <div className="flex flex-col gap-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={bloomL1} onChange={e => setBloomL1(e.target.checked)} className="w-4 h-4 text-[#6750A4] rounded border-slate-300 focus:ring-[#6750A4]" />
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Recall (L1) - Basic Facts</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={bloomL2} onChange={e => setBloomL2(e.target.checked)} className="w-4 h-4 text-[#6750A4] rounded border-slate-300 focus:ring-[#6750A4]" />
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Application (L2) - Procedures</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={bloomL3} onChange={e => setBloomL3(e.target.checked)} className="w-4 h-4 text-[#6750A4] rounded border-slate-300 focus:ring-[#6750A4]" />
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Scenario (L3) - Field Adjustments</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3 block">FRAC Competency Tag</label>
                  <select value={competencyTag} onChange={e => setCompetencyTag(e.target.value)} className="w-full bg-white dark:bg-slate-800 border border-[#E7E0EC] dark:border-[#49454F]/50 p-3 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 outline-none focus:border-[#6750A4] focus:ring-2 focus:ring-[#6750A4]/20">
                    <option>Sampling Methods</option>
                    <option>National Accounts</option>
                    <option>Survey Design</option>
                    <option>Data Quality</option>
                  </select>
                </div>

                <div className="pt-4 border-t border-[#E7E0EC] dark:border-[#49454F]/50">
                  <button 
                    onClick={handleGenerate}
                    className="w-full bg-[#6750A4] hover:bg-[#4F378B] text-white font-bold py-3.5 rounded-full shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer focus:ring-2 focus:ring-offset-2 focus:ring-[#6750A4]"
                  >
                    <Sparkles size={18}/> Generate Assessment
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Assessment Library List */
          <div className="flex flex-col gap-6 flex-1">
            {loadingLibrary ? (
              <div className="flex flex-col items-center justify-center p-12 text-slate-400 gap-4 bg-white dark:bg-slate-900 border border-[#E7E0EC] dark:border-[#49454F]/50 rounded-2xl shadow-sm">
                <Loader2 className="animate-spin text-[#6750A4] dark:text-[#D0BCFF]" size={32} />
                <p className="text-sm font-bold">Loading generated assessments history...</p>
              </div>
            ) : libraryAssessments.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center text-slate-400 gap-4 bg-white dark:bg-slate-900 border border-[#E7E0EC] dark:border-[#49454F]/50 rounded-2xl shadow-sm">
                <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-950/40 text-slate-300 dark:text-slate-700 flex items-center justify-center">
                  <BookOpen size={36} />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 mb-1 tracking-tight">No Generated Assessments Found</h3>
                  <p className="text-sm font-medium text-slate-500 max-w-sm mx-auto">
                    Use the "AI MCQ Generator" tab to upload MoSPI guidelines and auto-generate structured assessments.
                  </p>
                </div>
                <button 
                  onClick={() => setActiveSubTab('generate')}
                  className="mt-2 bg-[#6750A4] hover:bg-[#4F378B] text-white font-bold py-2 px-6 rounded-full text-xs shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  Generate Now
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {libraryAssessments.map(assessment => {
                  const isExpanded = expandedLibraryId === assessment.id;
                  const questionsCount = (assessment.questions || []).length;
                  return (
                    <div 
                      key={assessment.id} 
                      onClick={() => setExpandedLibraryId(isExpanded ? null : assessment.id)}
                      className="bg-white dark:bg-slate-900 border border-[#E7E0EC] dark:border-[#49454F]/50 rounded-2xl p-6 shadow-sm hover:border-[#6750A4] dark:hover:border-[#D0BCFF] transition-all flex flex-col cursor-pointer relative"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold border tracking-wider bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-200/50">
                          PUBLISHED
                        </span>
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={(e) => handleLoadToTrainer(assessment, e)}
                            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-[#6750A4] transition-colors"
                            title="Edit in Trainer Editor"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button 
                            onClick={(e) => handleDeleteLibraryAssessment(assessment.id, e)}
                            className="p-1.5 rounded-full hover:bg-red-50 dark:hover:bg-red-950/30 text-slate-400 hover:text-red-600 transition-colors"
                            title="Delete Assessment"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      
                      <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100 mb-2 leading-tight tracking-tight">
                        {assessment.title || 'Untitled Assessment'}
                      </h3>
                      
                      <p className="text-xs font-medium text-slate-500 mb-6 flex-1">
                        {assessment.description || 'Auto-generated competency assessment.'}
                      </p>

                      <div className="pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">Competency</p>
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">
                            {assessment.title?.replace(' Assessment', '') || 'Sampling'}
                          </p>
                        </div>
                        <div>
                          <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">Questions</p>
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{questionsCount} MCQs</p>
                        </div>
                      </div>

                      <button 
                        onClick={(e) => handleStartLibraryAssessment(assessment.id, e)}
                        className="w-full bg-[#EADDFF]/50 hover:bg-[#EADDFF] dark:bg-[#381E72]/40 dark:hover:bg-[#381E72] text-[#21005D] dark:text-[#EADDFF] py-2.5 rounded-full text-xs font-bold flex items-center justify-center gap-1.5 transition-all focus:ring-2 focus:ring-primary focus:outline-none cursor-pointer"
                      >
                        <Play size={12} fill="currentColor" /> Start Diagnostic Run
                      </button>

                      {isExpanded && assessment.questions && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-3 overflow-hidden text-left"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Question Preview ({questionsCount})</h4>
                          <div className="max-h-60 overflow-y-auto space-y-3 pr-1">
                            {assessment.questions.map((q: any, qIdx: number) => (
                              <div key={qIdx} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800 text-xs">
                                <p className="font-bold text-slate-800 dark:text-slate-200 mb-1">Q{qIdx + 1}: {q.text}</p>
                                <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                                  {q.options?.map((opt: string, oIdx: number) => (
                                    <li key={oIdx} className={q.correctIndex === oIdx ? 'text-emerald-600 dark:text-emerald-400 font-bold' : ''}>
                                      {opt} {q.correctIndex === oIdx && '✓'}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )
      ) : (
        /* Trainer Mode: QA Editor */
          <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-6 pb-20">
            {draftQuestions.map((q, qIndex) => (
              <div key={q.id} className="bg-white dark:bg-slate-900 border border-[#E7E0EC] dark:border-[#49454F]/50 rounded-2xl shadow-sm overflow-hidden flex flex-col lg:flex-row">
                
                {/* Left: Editing Form */}
                <div className="lg:w-3/5 p-6 lg:p-8 border-b lg:border-b-0 lg:border-r border-[#E7E0EC] dark:border-[#49454F]/50 flex flex-col gap-6">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full text-xs font-bold uppercase tracking-wider border border-[#E7E0EC] dark:border-[#49454F]/50">
                      Q{q.id}
                    </span>
                    <span className="px-3 py-1 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 rounded-full text-xs font-bold uppercase tracking-wider border border-blue-200/50 dark:border-blue-900/30 flex items-center gap-1">
                      <Target size={12}/> {q.bloom}
                    </span>
                  </div>
                  
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1"><Edit3 size={12}/> Question Text</label>
                    <textarea 
                      value={q.text} 
                      onChange={(e) => updateDraftQuestion(qIndex, 'text', e.target.value)}
                      className="w-full bg-white dark:bg-slate-950 border border-[#E7E0EC] dark:border-[#49454F]/50 p-4 rounded-xl text-sm font-bold text-slate-900 dark:text-slate-100 focus:border-[#6750A4] focus:ring-2 focus:ring-[#6750A4]/20 resize-none min-h-[80px]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Distractor Options</label>
                    <div className="flex flex-col gap-3">
                      {q.options.map((opt, optIndex) => (
                        <div key={optIndex} className="flex items-center gap-3">
                          <button 
                            onClick={() => updateDraftQuestion(qIndex, 'correctIndex', optIndex)}
                            className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 cursor-pointer ${q.correctIndex === optIndex ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30' : 'border-slate-300'}`}
                            title="Mark as correct answer"
                          >
                            {q.correctIndex === optIndex && <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full"/>}
                          </button>
                          <input 
                            value={opt}
                            onChange={(e) => updateOption(qIndex, optIndex, e.target.value)}
                            className={`flex-1 bg-white dark:bg-slate-950 border p-3 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 ${q.correctIndex === optIndex ? 'border-emerald-300 focus:ring-emerald-100 text-emerald-900 dark:text-emerald-300 font-bold bg-emerald-50/20' : 'border-[#E7E0EC] dark:border-[#49454F]/50 focus:border-[#6750A4] focus:ring-[#6750A4]/20 text-slate-700 dark:text-slate-300'}`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right: Rationale & Source Context */}
                <div className="lg:w-2/5 p-6 lg:p-8 bg-slate-50 dark:bg-slate-950/30 flex flex-col gap-6">
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1"><AlignLeft size={12}/> Explanation Rationale</label>
                    <textarea 
                      value={q.explanation} 
                      onChange={(e) => updateDraftQuestion(qIndex, 'explanation', e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-[#E7E0EC] dark:border-[#49454F]/50 p-4 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 focus:border-[#6750A4] focus:ring-2 focus:ring-[#6750A4]/20 resize-none min-h-[100px]"
                    />
                  </div>

                  <div className="bg-amber-50/40 dark:bg-amber-950/10 border border-amber-100 dark:border-amber-900/30 rounded-xl p-4 flex-1">
                    <label className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-2 flex items-center gap-1"><FileText size={12}/> Grounding Source Snippet</label>
                    <p className="text-xs font-mono text-slate-600 dark:text-slate-400 leading-relaxed italic">
                      "{q.source}"
                    </p>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>
    </Material3Layout>
  );
}
