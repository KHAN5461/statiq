const fs = require('fs');
let content = fs.readFileSync('src/components/AssessmentView.tsx', 'utf8');

// Add addDoc, serverTimestamp to imports
content = content.replace("import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';", "import { collection, query, orderBy, limit, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';\nimport { auth } from '../lib/firebase';");

// Replace handleSubmit
const submitReplacement = `  const handleSubmit = async () => {
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
    } catch(e) {
      console.error("Failed to save result", e);
    }
    setSubmitted(true);
  };`;

content = content.replace(/  const handleSubmit = \(\) => \{[\s\S]*?  \};/, submitReplacement);

fs.writeFileSync('src/components/AssessmentView.tsx', content);
