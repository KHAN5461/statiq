const fs = require('fs');
let content = fs.readFileSync('src/components/GeneratorView.tsx', 'utf8');

// Add firebase imports
content = content.replace("import { motion, AnimatePresence } from 'motion/react';", "import { motion, AnimatePresence } from 'motion/react';\nimport { collection, addDoc, serverTimestamp } from 'firebase/firestore';\nimport { db, auth } from '../lib/firebase';");

// Replace handleGenerate
const newHandleGenerate = `  const handleGenerate = async () => {
    if (!file) {
      alert("Please upload a document first.");
      return;
    }
    
    setGenerating(true);
    setGenStep(0);
    
    const stepInterval = setInterval(() => {
      setGenStep(prev => Math.min(prev + 1, generationSteps.length - 2));
    }, 1200);

    try {
      const sourceText = \`As per the National Sample Survey Office (NSSO) guidelines, the sampling frame for rural areas is usually the list of villages as per the latest Population Census. However, whenever the population of a sample First Stage Unit (FSU) exceeds 1200, it is to be divided into a suitable number of hamlet-groups to manage the listing workload. The Data Digital Personal Data Protection Act 2023 mandates that personal data of survey respondents must be anonymized before storage.\`;

      const response = await fetch("/api/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceText }),
      });

      if (!response.ok) {
        throw new Error("API failed");
      }

      const data = await response.json();
      
      const newQuestions = data.questions.map((q: any, i: number) => ({
        id: i + 1,
        text: q.question_text,
        options: q.options,
        correctIndex: q.correct_option_index,
        explanation: q.explanation,
        bloom: q.bloom_taxonomy_level,
        source: q.topic_tag,
      }));

      setDraftQuestions(newQuestions);
      
      clearInterval(stepInterval);
      setGenStep(generationSteps.length - 1);
      setTimeout(() => {
        setGenerating(false);
        setViewState('trainer');
      }, 800);
      
    } catch (e) {
      console.error(e);
      alert("Failed to generate assessment. Please try again.");
      clearInterval(stepInterval);
      setGenerating(false);
    }
  };`;

content = content.replace(/  const handleGenerate = \(\) => \{[\s\S]*?  \};/m, newHandleGenerate);

// Add handlePublish
const handlePublish = `  const handlePublish = async () => {
    try {
      await addDoc(collection(db, 'assessments'), {
        title: competencyTag + ' Assessment',
        description: 'Auto-generated assessment for ' + competencyTag,
        createdBy: auth.currentUser?.uid || 'anonymous',
        createdAt: serverTimestamp(),
        questions: draftQuestions
      });
      setCurrentView('admin');
    } catch (error) {
      console.error("Error publishing:", error);
      alert("Failed to publish assessment.");
    }
  };`;

content = content.replace("  const updateDraftQuestion =", handlePublish + "\n\n  const updateDraftQuestion =");

// Replace Publish button onClick
content = content.replace("onClick={() => setCurrentView('admin')} className=\"px-5 py-2 bg-primary text-white rounded-full text-sm font-bold hover:bg-primary-light shadow-md transition-colors flex items-center gap-2\"", "onClick={handlePublish} className=\"px-5 py-2 bg-primary text-white rounded-full text-sm font-bold hover:bg-primary-light shadow-md transition-colors flex items-center gap-2\"");

fs.writeFileSync('src/components/GeneratorView.tsx', content);
