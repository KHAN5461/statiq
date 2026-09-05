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
  BookOpen,
  Database,
  MoreVertical
} from 'lucide-react';
import { ViewState } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { collection, addDoc, updateDoc, serverTimestamp, query, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Material3Layout } from './Material3Layout';
import { Material3Skeleton } from './Material3Skeleton';
import { M3EmptyState } from './M3EmptyState';

import { useNavigate, useLocation } from 'react-router-dom';

interface GeneratorViewProps {
  setActiveAssessment?: (assessment: any) => void;
}

const generationSteps = [
  "Initializing LLM Engine...",
  "Extracting tokens from document...",
  "Mapping context to FRAC taxonomy...",
  "Generating distractor options...",
  "Finalizing JSON Assessment..."
];

export function GeneratorView({ setActiveAssessment }: GeneratorViewProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [viewState, setViewState] = useState<'ingestion' | 'trainer'>('ingestion');
  const [activeSubTab, setActiveSubTab] = useState<'generate' | 'library'>('generate');
  const [showOptionsDropdown, setShowOptionsDropdown] = useState(false);
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

  const [editorMode, setEditorMode] = useState<'cards' | 'raw_json'>('cards');
  const [rawJsonInput, setRawJsonInput] = useState<string>('');
  const [jsonError, setJsonError] = useState<string | null>(null);

  const [draftQuestions, setDraftQuestions] = useState<any[]>([]);

  const [libraryAssessments, setLibraryAssessments] = useState<any[]>([]);
  const [loadingLibrary, setLoadingLibrary] = useState(true);
  const [expandedLibraryId, setExpandedLibraryId] = useState<string | null>(null);

  useEffect(() => {
    if (location.state?.editAssessment) {
      const assessment = location.state.editAssessment;
      setGeneratedAssessment(assessment);
      setDraftQuestions(assessment.questions || []);
      const plainTag = (assessment.title || '').replace(' Assessment', '');
      setCompetencyTag(plainTag || 'Sampling Methods');
      setViewState('trainer');
      // Clear state so reload doesn't trigger it again
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

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
    navigate('/assessment/' + id);
  };

  const handleFileDropOrSelect = (f: File) => {
    if (!f.type.includes('pdf') && !f.name.toLowerCase().endsWith('.pdf')) {
      setError("Strict Grounding Policy: Only PDF documents are supported. Please upload an official .pdf file to ground questions strictly against its content.");
      return;
    }

    setFile(f.name);
    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      const base64 = result.split(',')[1];
      setPdfBase64(base64);
      setInputText(`[Strict PDF Grounding Active: ${f.name} (${Math.round(f.size / 1024)} KB) loaded. Questions will be strictly grounded only from this PDF.]`);
    };
    reader.onerror = () => {
      setError("Failed to read the PDF file.");
    };
    reader.readAsDataURL(f);
  };

  const handleGenerate = async () => {
    if (!pdfBase64) {
      setError("Strict Grounding Policy: An official PDF document is required. Please upload a PDF file to ground assessment questions.");
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
          pdfBase64,
          fileName: file,
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
      let questionCounter = 1;
      
      if (data.questions && Array.isArray(data.questions)) {
        data.questions.forEach((q: any) => {
          flattened.push({
            id: questionCounter++,
            text: q.question_text || q.prompt || q.text,
            options: q.options || [],
            correctIndex: q.correct_option_index ?? q.correct_index ?? q.correctIndex ?? 0,
            explanation: q.explanation || q.rationale || '',
            bloom: q.bloom_level || q.bloom || 'L2: Application',
            topic_tag: q.topic_tag || competencyTag,
            section_name: q.topic_tag ? `${q.topic_tag} Competency Module` : 'Assessment Questions',
            section_type: q.data_table_markdown ? 'data_interpretation_caselet' : 'standard_mcq',
            data_table_markdown: q.data_table_markdown || ''
          });
        });
      } else if (data.sections && Array.isArray(data.sections)) {
        data.sections.forEach((sec: any) => {
          if (sec.questions && Array.isArray(sec.questions)) {
            sec.questions.forEach((q: any) => {
              flattened.push({
                id: questionCounter++,
                text: q.question_text || q.prompt || q.text,
                options: q.options || [],
                correctIndex: q.correct_option_index ?? q.correct_index ?? q.correctIndex ?? 0,
                explanation: q.explanation || q.rationale || '',
                bloom: q.bloom_level || q.bloom || 'L2: Application',
                topic_tag: q.topic_tag || competencyTag,
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
      const titleToUse = generatedAssessment?.assessment_title || generatedAssessment?.title || (competencyTag + ' Assessment');
      const assessmentData = {
        title: titleToUse,
        assessment_title: titleToUse,
        description: 'Auto-generated assessment for ' + (generatedAssessment?.target_domain || competencyTag),
        createdBy: auth.currentUser?.uid || 'anonymous',
        createdAt: serverTimestamp(),
        questions: draftQuestions,
        sections: reconstructSections(draftQuestions),
        assessment_id: generatedAssessment?.assessment_id || `ASMT-${Date.now()}`,
        target_cadre: generatedAssessment?.target_cadre || "JSO / SSO",
        target_domain: generatedAssessment?.target_domain || competencyTag,
        passing_criteria_pct: generatedAssessment?.passing_criteria_pct || 70,
        cohort: generatedAssessment?.cohort || 'All Cohorts',
        target_zone: generatedAssessment?.target_zone || 'All Zones',
        status: 'Published'
      };

      if (generatedAssessment?.id) {
        await updateDoc(doc(db, 'assessments', generatedAssessment.id), assessmentData);
      } else {
        await addDoc(collection(db, 'assessments'), assessmentData);
      }

      // Clear local draft after successful publish
      alert(`Assessment "${titleToUse}" published successfully to Assessment Manager!`);
      navigate('/admin/library');
    } catch (error) {
      console.error("Error publishing:", error);
      alert("Failed to publish assessment.");
    }
  };

  const handleSaveDraft = async () => {
    if (draftQuestions.length === 0) {
      alert("No questions to save.");
      return;
    }
    const titleToUse = generatedAssessment?.title || `${competencyTag} Assessment`;
    const descToUse = generatedAssessment?.description || "Auto-generated assessment.";
    
    const assessmentData = {
      title: titleToUse,
      description: descToUse,
      questions: draftQuestions,
      createdBy: auth.currentUser?.uid || 'system',
      createdAt: serverTimestamp(),
      cohort: 'Unassigned',
      target_zone: 'Unassigned',
      status: 'Draft'
    };

    try {
      if (generatedAssessment?.id) {
        await updateDoc(doc(db, 'assessments', generatedAssessment.id), assessmentData);
      } else {
        await addDoc(collection(db, 'assessments'), assessmentData);
      }
      alert(`Draft saved to Assessment Manager.`);
      navigate('/admin/library');
    } catch (e) {
      console.error(e);
      alert('Failed to save draft to Firebase.');
    }
  };

  const handleTestRun = async () => {
    try {
      const activeObj = {
        title: generatedAssessment?.assessment_title || generatedAssessment?.title || (competencyTag + ' Assessment (Draft)'),
        description: generatedAssessment?.assessment_description || generatedAssessment?.description || "Auto-generated draft assessment.",
        target_domain: competencyTag,
        target_cadre: generatedAssessment?.target_cadre || 'JSO / SSO Officers',
        questions: draftQuestions,
        createdBy: auth.currentUser?.uid || 'system',
        createdAt: serverTimestamp(),
        cohort: 'Unassigned',
        target_zone: 'Unassigned',
        status: 'Draft'
      };
      const docRef = await addDoc(collection(db, 'assessments'), activeObj);
      navigate('/assessment/' + docRef.id);
    } catch (error) {
      console.error("Error creating draft test:", error);
      alert("Failed to start test run.");
    }
  };

  const handleRename = async () => {
    if (!generatedAssessment?.id) {
      alert("Please save the assessment as a draft first before renaming.");
      setShowOptionsDropdown(false);
      return;
    }
    const currentTitle = generatedAssessment?.title || generatedAssessment?.assessment_title || '';
    const newTitle = window.prompt("Enter new assessment title:", currentTitle);
    if (newTitle && newTitle.trim() !== '' && newTitle !== currentTitle) {
      try {
        await updateDoc(doc(db, 'assessments', generatedAssessment.id), {
          title: newTitle.trim(),
          assessment_title: newTitle.trim()
        });
        setGeneratedAssessment({ ...generatedAssessment, title: newTitle.trim(), assessment_title: newTitle.trim() });
        alert("Assessment renamed successfully.");
      } catch (error) {
        console.error("Error renaming assessment:", error);
        alert("Failed to rename assessment.");
      }
    }
    setShowOptionsDropdown(false);
  };

  const handleUnpublish = async () => {
    if (!generatedAssessment?.id) {
      alert("This assessment has not been saved or published yet.");
      setShowOptionsDropdown(false);
      return;
    }
    try {
      await updateDoc(doc(db, 'assessments', generatedAssessment.id), {
        status: 'Draft'
      });
      setGeneratedAssessment({ ...generatedAssessment, status: 'Draft' });
      alert("Assessment unpublished. It is now a Draft.");
    } catch (error) {
      console.error("Error unpublishing assessment:", error);
      alert("Failed to unpublish assessment.");
    }
    setShowOptionsDropdown(false);
  };

  const handleDelete = async () => {
    if (!generatedAssessment?.id) {
      // Just clear local state
      setGeneratedAssessment(null);
      setDraftQuestions([]);
      setViewState('ingestion');
      setShowOptionsDropdown(false);
      return;
    }
    if (window.confirm("Are you sure you want to delete this assessment? This action cannot be undone.")) {
      try {
        await deleteDoc(doc(db, 'assessments', generatedAssessment.id));
        alert("Assessment deleted successfully.");
        navigate('/admin');
      } catch (error) {
        console.error("Error deleting assessment:", error);
        alert("Failed to delete assessment.");
      }
    }
    setShowOptionsDropdown(false);
  };

  const syncDraftsToRawJson = () => {
    const fullSchemaObj = {
      assessment_title: generatedAssessment?.assessment_title || generatedAssessment?.title || (competencyTag + ' Assessment'),
      target_cadre: generatedAssessment?.target_cadre || 'JSO / SSO Officers',
      target_domain: competencyTag,
      questions: draftQuestions.map((q, idx) => ({
        id: `q${idx + 1}`,
        question_text: q.text || q.question_text || q.prompt,
        options: q.options || [],
        correct_option_index: q.correctIndex ?? q.correct_option_index ?? 0,
        explanation: q.explanation || '',
        bloom_level: q.bloom || 'L2: Application',
        topic_tag: q.topic_tag || competencyTag,
        ...(q.data_table_markdown ? { data_table_markdown: q.data_table_markdown } : {})
      }))
    };
    setRawJsonInput(JSON.stringify(fullSchemaObj, null, 2));
    setJsonError(null);
  };

  const handleApplyRawJson = () => {
    try {
      const parsed = JSON.parse(rawJsonInput);
      if (!parsed.questions || !Array.isArray(parsed.questions)) {
        setJsonError("Invalid JSON: 'questions' must be an array of question objects.");
        return;
      }
      let counter = 1;
      const formattedQs = parsed.questions.map((rq: any) => ({
        id: counter++,
        text: rq.question_text || rq.prompt || rq.text,
        options: rq.options || [],
        correctIndex: rq.correct_option_index ?? rq.correct_index ?? rq.correctIndex ?? 0,
        explanation: rq.explanation || rq.rationale || '',
        bloom: rq.bloom_level || rq.bloom || 'L2: Application',
        topic_tag: rq.topic_tag || competencyTag,
        section_name: rq.topic_tag ? `${rq.topic_tag} Competency Module` : 'Assessment Questions',
        section_type: rq.data_table_markdown ? 'data_interpretation_caselet' : 'standard_mcq',
        data_table_markdown: rq.data_table_markdown || ''
      }));

      setDraftQuestions(formattedQs);
      setGeneratedAssessment(parsed);
      setJsonError(null);
      alert(`Applied ${formattedQs.length} questions from raw JSON successfully!`);
    } catch (e: any) {
      setJsonError(`JSON Syntax Error: ${e.message}`);
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
      subtitle={viewState === 'ingestion' ? 'Upload official PDF manuals or circulars. All assessment questions are strictly grounded only from the uploaded PDF.' : 'Review, customize, and validate the AI-generated questions against ground-truth text snippets.'}
    >
      <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto w-full flex-1 flex flex-col gap-8 pb-24">
      
      {/* Sub tabs in ingestion mode */}
      {viewState === 'ingestion' && (
        <div className="flex gap-6 border-b border-slate-200 dark:border-slate-800 pb-2 shrink-0">
          <button 
            onClick={() => setActiveSubTab('generate')}
            className={`pb-2 text-sm font-bold transition-all relative ${activeSubTab === 'generate' ? 'text-blue-900 dark:text-blue-200' : 'text-slate-400 hover:text-slate-600'}`}
          >
            AI MCQ Generator
            {activeSubTab === 'generate' && <motion.div layoutId="gensubtab" className="absolute bottom-0 left-0 right-0 h-1 bg-blue-900 dark:bg-[#D0BCFF] rounded-t-full" />}
          </button>
          <button 
            onClick={() => setActiveSubTab('library')}
            className={`pb-2 text-sm font-bold transition-all relative ${activeSubTab === 'library' ? 'text-blue-900 dark:text-blue-200' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Saved Assessments History ({libraryAssessments.length})
            {activeSubTab === 'library' && <motion.div layoutId="gensubtab" className="absolute bottom-0 left-0 right-0 h-1 bg-blue-900 dark:bg-[#D0BCFF] rounded-t-full" />}
          </button>
        </div>
      )}
      
      {/* Action Toolbar for Trainer Mode */}
      {viewState === 'trainer' && !generating && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl flex flex-col md:flex-row justify-between items-center gap-4 shadow-sm shrink-0">
          <div className="flex items-center gap-4">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Generated {draftQuestions.length} draft MCQs.
            </p>
            
            {/* Editor Mode Switcher */}
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setEditorMode('cards')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${editorMode === 'cards' ? 'bg-white dark:bg-slate-900 text-blue-900 dark:text-blue-200 shadow-xs' : 'text-slate-500'}`}
              >
                Visual Cards
              </button>
              <button
                onClick={() => {
                  syncDraftsToRawJson();
                  setEditorMode('raw_json');
                }}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${editorMode === 'raw_json' ? 'bg-white dark:bg-slate-900 text-blue-900 dark:text-blue-200 shadow-xs' : 'text-slate-500'}`}
              >
                Raw JSON Schema Editor
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button onClick={handleSaveDraft} className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-full text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm flex items-center gap-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-900 w-full sm:w-auto justify-center">
              <Save size={16}/> Save Draft
            </button>
            <button onClick={handleTestRun} className="px-4 py-2 bg-white dark:bg-slate-800 border border-amber-500/50 text-amber-700 dark:text-amber-400 rounded-full text-sm font-bold hover:bg-amber-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500 w-full sm:w-auto justify-center">
              <PlayCircle size={16}/> Test Run
            </button>
            <div className="relative flex">
              <button onClick={handlePublish} className="px-6 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-l-full text-sm font-bold shadow-md hover:shadow-lg transition-colors flex items-center gap-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-900 w-full sm:w-auto justify-center border-r border-blue-800/50">
                <Send size={16}/> Publish
              </button>
              <button 
                onClick={() => setShowOptionsDropdown(!showOptionsDropdown)}
                className="px-2 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-r-full shadow-md hover:shadow-lg transition-colors flex items-center justify-center cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-900"
              >
                <MoreVertical size={16} />
              </button>
              
              {showOptionsDropdown && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-1 z-50 overflow-hidden">
                  <button onClick={handleRename} className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 cursor-pointer">
                    <Edit3 size={14}/> Rename
                  </button>
                  <button onClick={handleUnpublish} className="w-full text-left px-4 py-2 text-sm text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 flex items-center gap-2 cursor-pointer">
                    <Target size={14}/> Unpublish
                  </button>
                  <div className="h-px bg-slate-100 dark:bg-slate-700 my-1"></div>
                  <button onClick={handleDelete} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 cursor-pointer">
                    <Trash2 size={14}/> Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Content Area */}
      {generating ? (
        <div className="flex flex-col lg:flex-row gap-8 flex-1 min-h-0 overflow-y-auto">
          {/* Left side: Shimmering Skeleton of generated assessment */}
          <div className="flex-1">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 sm:p-8 mb-4">
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
            <div className="sticky top-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm flex flex-col gap-6">
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
        </div>
      ) : viewState === 'ingestion' ? (
        activeSubTab === 'generate' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1">
            
            {/* Left: Drag & Drop + Text Editor */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              {/* Drag & Drop */}
              <div 
                className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-all min-h-[300px] flex-1
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
                  <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center max-w-md">
                    <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mb-3 border border-emerald-200 shadow-sm">
                      <CheckCircle2 size={26} />
                    </div>
                    <span className="text-[10px] font-extrabold tracking-wider uppercase px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 mb-2">
                      Strict PDF Grounding Active
                    </span>
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-0.5">Reference PDF Loaded</h3>
                    <p className="text-slate-600 dark:text-slate-400 font-mono text-xs mb-2 font-semibold text-center break-all">{file}</p>
                    <p className="text-slate-500 dark:text-slate-400 text-xs text-center mb-4 leading-relaxed">
                      Questions will be synthesized strictly from this PDF document. All ungrounded external assumptions are forbidden.
                    </p>
                    <button 
                      onClick={() => { setFile(null); setInputText(''); setPdfBase64(null); setError(null); }} 
                      className="text-red-500 hover:text-red-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer bg-red-50 dark:bg-red-950/20 px-4 py-2 rounded-full border border-red-200 dark:border-red-900/30"
                    >
                      <Trash2 size={13} /> Remove and Select Different PDF
                    </button>
                  </motion.div>
                ) : (
                  <>
                    <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/50/30 rounded-2xl flex items-center justify-center text-blue-900 dark:text-blue-200 mb-3 shadow-inner">
                      <UploadCloud size={26} />
                    </div>
                    <span className="text-[10px] font-extrabold tracking-wider uppercase px-3 py-1 rounded-full bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-300 mb-2">
                      PDF Grounding Only
                    </span>
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1 tracking-tight">Upload Reference PDF Document</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-xs max-w-md mb-5 font-medium leading-relaxed">
                      Questions and answers will be grounded <strong className="text-slate-700 dark:text-slate-200">strictly and exclusively from this PDF</strong> with zero hallucinations.
                    </p>
                    <label className="bg-blue-900 hover:bg-blue-950 text-white px-7 py-2.5 rounded-full font-bold text-xs cursor-pointer shadow-md transition-all active:scale-95 flex items-center gap-2 focus:ring-2 focus:ring-blue-900 focus:outline-none">
                      <FileText size={15} /> Browse PDF Files
                      <input 
                        type="file" 
                        accept=".pdf,application/pdf"
                        className="hidden" 
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleFileDropOrSelect(e.target.files[0]);
                          }
                        }} 
                      />
                    </label>
                  </>
                )}
              </div>
            </div>

            {/* Right: Parameters */}
            <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col h-fit sticky top-6">
              <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-4 mb-6">
                <div className="p-2 bg-blue-50 dark:bg-blue-900/40 rounded-xl text-blue-900 dark:text-blue-200">
                  <Settings2 size={18} strokeWidth={2.5} />
                </div>
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">Generation Parameters</h2>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="flex justify-between items-center mb-3">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Question Count</span>
                    <span className="text-blue-900 dark:text-blue-200 font-bold">{totalQuestions}</span>
                  </label>
                  <input 
                    type="range" min="5" max="50" step="5" 
                    value={totalQuestions} 
                    onChange={e => setTotalQuestions(Number(e.target.value))}
                    className="w-full accent-blue-900"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3 block">Bloom's Taxonomy Distribution</label>
                  <div className="flex flex-col gap-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={bloomL1} onChange={e => setBloomL1(e.target.checked)} className="w-4 h-4 text-blue-900 rounded border-slate-300 focus:ring-blue-900" />
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Recall (L1) - Basic Facts</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={bloomL2} onChange={e => setBloomL2(e.target.checked)} className="w-4 h-4 text-blue-900 rounded border-slate-300 focus:ring-blue-900" />
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Application (L2) - Procedures</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={bloomL3} onChange={e => setBloomL3(e.target.checked)} className="w-4 h-4 text-blue-900 rounded border-slate-300 focus:ring-blue-900" />
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Scenario (L3) - Field Adjustments</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3 block">FRAC Competency Axis (8 MoSPI Axes)</label>
                  <select value={competencyTag} onChange={e => setCompetencyTag(e.target.value)} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 p-3 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 outline-none focus:border-blue-900 focus:ring-2 focus:ring-blue-900/20 mb-2">
                    <option value="Sampling">1. Sampling (NSSO, Frame, Hamlet-Groups)</option>
                    <option value="Accounts">2. Accounts (SNA, GVA, LIM Method)</option>
                    <option value="Indices">3. Indices (CPI, IIP, WPI Weights)</option>
                    <option value="Python/R">4. Python/R (Data Science & Analytics)</option>
                    <option value="GIS">5. GIS (Spatial Stratification & Geo-tagging)</option>
                    <option value="Governance">6. Governance (DPDP Act, NDSAP Guidelines)</option>
                    <option value="Quality">7. Quality (Auditing & Error Bounds)</option>
                    <option value="Field Ops">8. Field Ops (Enumeration Workload & CAPI)</option>
                    <option value="__custom__">Custom Tag...</option>
                  </select>
                  {competencyTag === '__custom__' && (
                    <input
                      type="text"
                      placeholder="Enter custom FRAC competency tag..."
                      className="w-full bg-white dark:bg-slate-800 border border-blue-900 p-3 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-blue-900/20"
                      onChange={e => setCompetencyTag(e.target.value || '__custom__')}
                    />
                  )}
                </div>

                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-2">
                  <button 
                    onClick={handleGenerate}
                    className={`w-full font-bold py-3.5 rounded-full shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer focus:ring-2 focus:ring-offset-2 focus:ring-blue-900 ${
                      pdfBase64 
                        ? 'bg-blue-900 hover:bg-blue-800 text-white' 
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-300'
                    }`}
                  >
                    <Sparkles size={18}/> Generate Assessment (Strict PDF Grounding)
                  </button>
                  {!file && (
                    <p className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold text-center flex items-center justify-center gap-1 mt-1">
                      <AlertCircle size={13} /> PDF upload required for strict grounding
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Assessment Library List */
          <div className="flex flex-col gap-6 flex-1">
            {loadingLibrary ? (
              <div className="flex flex-col items-center justify-center p-12 text-slate-400 gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
                <Loader2 className="animate-spin text-blue-900 dark:text-blue-200" size={32} />
                <p className="text-sm font-bold">Loading generated assessments history...</p>
              </div>
            ) : libraryAssessments.length === 0 ? (
              <M3EmptyState 
                icon={BookOpen}
                badge="Saved Assessment Library"
                title="No Saved Assessments Yet"
                subtitle="Generated assessments saved or published to Firestore will appear in this library."
                actionLabel="Generate First Assessment"
                onAction={() => setActiveSubTab('generate')}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {libraryAssessments.map(assessment => {
                  const isExpanded = expandedLibraryId === assessment.id;
                  const questionsCount = (assessment.questions || []).length;
                  return (
                    <div 
                      key={assessment.id} 
                      onClick={() => setExpandedLibraryId(isExpanded ? null : assessment.id)}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm hover:border-blue-900 dark:hover:border-[#D0BCFF] transition-all flex flex-col cursor-pointer relative"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold border tracking-wider bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-200/50">
                          PUBLISHED
                        </span>
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={(e) => handleLoadToTrainer(assessment, e)}
                            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-blue-900 transition-colors"
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
                        className="w-full bg-blue-50/50 hover:bg-blue-50 dark:bg-blue-900/40 dark:hover:bg-[#381E72] text-blue-900 dark:text-blue-100 py-2.5 rounded-full text-xs font-bold flex items-center justify-center gap-1.5 transition-all focus:ring-2 focus:ring-primary focus:outline-none cursor-pointer"
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
        editorMode === 'raw_json' ? (
          <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-4 pb-20">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <FileText size={18} className="text-blue-900" /> Raw Assessment JSON Schema Editor
                  </h3>
                  <p className="text-xs text-slate-500">Edit the raw assessment JSON directly and apply changes to update the trainer cards and test runner.</p>
                </div>
                <button
                  onClick={handleApplyRawJson}
                  className="px-5 py-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded-full text-xs font-bold shadow-sm transition-colors cursor-pointer"
                >
                  Apply Raw JSON Changes
                </button>
              </div>

              {jsonError && (
                <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-xl text-xs font-mono text-red-700 dark:text-red-300 flex gap-3 items-start shadow-sm mb-4">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <div className="flex flex-col gap-1">
                    <span className="font-bold font-sans uppercase tracking-widest text-[10px]">JSON Syntax Error</span>
                    <span>{jsonError}</span>
                  </div>
                </div>
              )}

              <textarea
                value={rawJsonInput}
                onChange={(e) => setRawJsonInput(e.target.value)}
                className="w-full h-[550px] bg-slate-950 text-emerald-400 font-mono text-xs p-4 rounded-xl border border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-900"
                spellCheck={false}
              />
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-6 pb-20">
            {generatedAssessment?.isOfflineFallback && (
              <div className="p-4 bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/40 rounded-xl flex items-center justify-between text-xs text-blue-950 dark:text-blue-200 shadow-sm">
                <div className="flex items-center gap-2.5">
                  <Sparkles size={16} className="text-blue-900 dark:text-blue-300 shrink-0" />
                  <span>
                    <strong>MoSPI Competency Knowledge Engine:</strong> Questions were synthesized from MoSPI's official statistical competency framework. All items are fully editable below.
                  </span>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-900 dark:text-blue-200 uppercase tracking-wider shrink-0 border border-blue-200 dark:border-blue-800">
                  Engine Active
                </span>
              </div>
            )}
            {draftQuestions.length === 0 ? (
              <M3EmptyState 
                icon={Database}
                badge="Trainer QA Editor Empty"
                title="No Draft Questions Available"
                subtitle="Generate a new assessment by uploading an official reference manual or pasting a text corpus."
                actionLabel="Go to Document Ingestion"
                onAction={() => setViewState('ingestion')}
              />
            ) : (
              draftQuestions.map((q, qIndex) => (
                <div key={q.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden flex flex-col lg:flex-row">
                
                {/* Left: Editing Form */}
                <div className="lg:w-3/5 p-6 lg:p-8 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 flex flex-col gap-6">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full text-xs font-bold uppercase tracking-wider border border-slate-200 dark:border-slate-800">
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
                      className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-4 rounded-xl text-sm font-bold text-slate-900 dark:text-slate-100 focus:border-blue-900 focus:ring-2 focus:ring-blue-900/20 resize-none min-h-[80px]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Distractor Options</label>
                    <div className="flex flex-col gap-3">
                      {q.options.map((opt: string, optIndex: number) => (
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
                            className={`flex-1 bg-white dark:bg-slate-950 border p-3 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 ${q.correctIndex === optIndex ? 'border-emerald-300 focus:ring-emerald-100 text-emerald-900 dark:text-emerald-300 font-bold bg-emerald-50/20' : 'border-slate-200 dark:border-slate-800 focus:border-blue-900 focus:ring-blue-900/20 text-slate-700 dark:text-slate-300'}`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {q.data_table_markdown && (
                    <div>
                      <label className="text-[11px] font-bold text-blue-500 uppercase tracking-widest mb-2 flex items-center gap-1"><FileText size={12}/> Data Interpretation Table (Markdown)</label>
                      <textarea
                        value={q.data_table_markdown}
                        onChange={(e) => updateDraftQuestion(qIndex, 'data_table_markdown', e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-900/30 p-3 rounded-xl text-xs font-mono text-slate-700 dark:text-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 resize-none min-h-[90px]"
                      />
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1"><Target size={12}/> Bloom Level</label>
                    <select
                      value={q.bloom}
                      onChange={e => updateDraftQuestion(qIndex, 'bloom', e.target.value)}
                      className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 p-1.5 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 outline-none focus:border-blue-900"
                    >
                      <option>Recall</option>
                      <option>Application</option>
                      <option>Scenario</option>
                      <option>Recall L1</option>
                      <option>Application L2</option>
                    </select>
                    <button
                      onClick={() => {
                        if (window.confirm('Remove this question?')) {
                          const newQs = draftQuestions.filter((_, i) => i !== qIndex);
                          setDraftQuestions(newQs);
                        }
                      }}
                      className="ml-auto p-1.5 rounded-full hover:bg-red-50 dark:hover:bg-red-950/30 text-slate-400 hover:text-red-600 transition-colors"
                      title="Delete this question"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Right: Rationale & Source Context */}
                <div className="lg:w-2/5 p-6 lg:p-8 bg-slate-50 dark:bg-slate-950/30 flex flex-col gap-6">
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1"><AlignLeft size={12}/> Explanation Rationale</label>
                    <textarea 
                      value={q.explanation} 
                      onChange={(e) => updateDraftQuestion(qIndex, 'explanation', e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 focus:border-blue-900 focus:ring-2 focus:ring-blue-900/20 resize-none min-h-[100px]"
                    />
                  </div>

                  <div className="bg-amber-50/40 dark:bg-amber-950/10 border border-amber-100 dark:border-amber-900/30 rounded-xl p-4 flex-1">
                    <label className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-2 flex items-center gap-1"><FileText size={12}/> Grounding Source Snippet</label>
                    <p className="text-xs font-mono text-slate-600 dark:text-slate-400 leading-relaxed italic">
                      "{q.source || 'Uploaded MoSPI Manual Reference Document'}"
                    </p>
                  </div>
                </div>

              </div>
            ))
          )}
          </div>
        )
      )}
      </div>
    </Material3Layout>
  );
}
