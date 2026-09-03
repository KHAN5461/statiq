const fs = require('fs');
let content = fs.readFileSync('src/components/LearnerView.tsx', 'utf8');

content = content.replace("import { motion } from 'motion/react';", "import { motion } from 'motion/react';\nimport { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';\nimport { db } from '../lib/firebase';");

const newFetch = `  useEffect(() => {
    const fetchCompetencyData = async () => {
      const rawData = [
        { subject: 'Sampling', current: 3, benchmark: 5 },
        { subject: 'Accounts', current: 5, benchmark: 5 },
        { subject: 'Indices', current: 4, benchmark: 5 },
        { subject: 'Python/R', current: 2, benchmark: 4 },
        { subject: 'GIS', current: 3, benchmark: 4 },
        { subject: 'Governance', current: 5, benchmark: 5 },
        { subject: 'Quality', current: 4, benchmark: 5 },
        { subject: 'Field Ops', current: 3, benchmark: 4 },
      ];
      
      try {
        const q = query(collection(db, 'results'), orderBy('submittedAt', 'desc'), limit(1));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const latestResult = snap.docs[0].data();
          // Update Sampling score with the ratio mapped to a 5-point scale
          const ratio = latestResult.score / latestResult.maxScore;
          rawData[0].current = Math.round(ratio * 5);
        }
      } catch (e) {
        console.error("Failed to fetch results", e);
      }

      const enrichedData = rawData.map(item => ({
        ...item,
        delta: item.benchmark - item.current
      }));
      
      setRadarData(enrichedData);
      setIsLoading(false);
    };
    fetchCompetencyData();
  }, []);`;

content = content.replace(/  useEffect\(\(\) => \{[\s\S]*?    fetchCompetencyData\(\);\n  \}, \[\]\);/, newFetch);

fs.writeFileSync('src/components/LearnerView.tsx', content);
