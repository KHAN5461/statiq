const fs = require('fs');
let content = fs.readFileSync('src/lib/AuthContext.tsx', 'utf8');

// Replace interface
content = content.replace("signInWithGoogle: () => Promise<void>;", "signInWithGoogle: (forcedRole?: 'admin' | 'learner') => Promise<void>;");

// Replace implementation
content = content.replace("const signInWithGoogle = async () => {", "const signInWithGoogle = async (forcedRole?: 'admin' | 'learner') => {");
content = content.replace("await signInWithPopup(auth, provider);", "const result = await signInWithPopup(auth, provider);\n    if (forcedRole) {\n      const { doc, setDoc } = require('firebase/firestore');\n      await setDoc(doc(db, 'users', result.user.uid), { role: forcedRole }, { merge: true });\n      setRole(forcedRole);\n    }");

fs.writeFileSync('src/lib/AuthContext.tsx', content);
