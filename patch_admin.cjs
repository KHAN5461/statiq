const fs = require('fs');
let content = fs.readFileSync('src/components/AdminView.tsx', 'utf8');

// Add firebase imports
content = content.replace("import { motion, AnimatePresence } from 'motion/react';", "import { motion, AnimatePresence } from 'motion/react';\nimport { collection, query, orderBy, onSnapshot } from 'firebase/firestore';\nimport { db } from '../lib/firebase';\nimport { useEffect } from 'react';");

// Replace assessments state
const stateReplacement = `  const [assessments, setAssessments] = useState<any[]>([]);
  
  useEffect(() => {
    const q = query(collection(db, 'assessments'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Map fields for the UI
        title: doc.data().title || 'Untitled Assessment',
        status: 'Published', // Mocked status since they are pushed
        cohort: 'All Cohorts',
        date: doc.data().createdAt ? new Date(doc.data().createdAt.toDate()).toLocaleDateString() : 'Just now',
        questions: (doc.data().questions || []).length
      }));
      setAssessments(fetched);
    });
    return () => unsubscribe();
  }, []);`;

content = content.replace(/  \/\/ Mock Assessment Data[\s\S]*?\]\);/, stateReplacement);

fs.writeFileSync('src/components/AdminView.tsx', content);
