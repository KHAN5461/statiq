const fs = require('fs');
let content = fs.readFileSync('src/components/AssessmentView.tsx', 'utf8');

// Add firebase imports
content = content.replace("import { motion, AnimatePresence } from 'motion/react';", "import { motion, AnimatePresence } from 'motion/react';\nimport { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';\nimport { db } from '../lib/firebase';");

// Replace state
const stateReplacement = `  const [questions, setQuestions] = useState<any[]>(QUESTIONS);
  const [loadingDb, setLoadingDb] = useState(true);

  useEffect(() => {
    const fetchLatestAssessment = async () => {
      try {
        const q = query(collection(db, 'assessments'), orderBy('createdAt', 'desc'), limit(1));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const doc = snap.docs[0];
          const rawQ = doc.data().questions;
          if (rawQ && rawQ.length > 0) {
            const formatted = rawQ.map((rq: any, idx: number) => ({
              id: rq.id || (idx + 1),
              text: rq.text || rq.question_text,
              options: (rq.options || []).map((optText: string, oIdx: number) => ({
                id: ['a','b','c','d'][oIdx % 4],
                text: optText,
                label: ['A','B','C','D'][oIdx % 4],
                keybind: String(oIdx + 1)
              })),
              correct: ['a','b','c','d'][rq.correctIndex ?? rq.correct_option_index ?? 0],
              rationale: rq.explanation
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
    fetchLatestAssessment();
  }, []);

  const [currentIdx, setCurrentIdx] = useState(0);`;

content = content.replace(/  const \[currentIdx, setCurrentIdx\] = useState\(0\);/, stateReplacement);

// Replace QUESTIONS.length with questions.length
content = content.replace(/QUESTIONS\.length/g, "questions.length");
// Replace QUESTIONS[currentIdx] with questions[currentIdx]
content = content.replace(/QUESTIONS\[/g, "questions[");

fs.writeFileSync('src/components/AssessmentView.tsx', content);
