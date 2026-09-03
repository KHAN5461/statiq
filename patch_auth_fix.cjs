const fs = require('fs');
let content = fs.readFileSync('src/lib/AuthContext.tsx', 'utf8');

content = content.replace("const { doc, setDoc } = require('firebase/firestore');", "");

fs.writeFileSync('src/lib/AuthContext.tsx', content);
