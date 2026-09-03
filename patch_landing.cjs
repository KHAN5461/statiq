const fs = require('fs');
let content = fs.readFileSync('src/components/LandingPage.tsx', 'utf8');

// update handleAuthAction
content = content.replace("const handleAuthAction = async () => {", "const handleAuthAction = async (forcedRole?: 'admin' | 'learner') => {");
content = content.replace("      if (role === 'admin') setCurrentView('admin');", "      if (role === 'admin' || forcedRole === 'admin') setCurrentView('admin');");
content = content.replace("      await signInWithGoogle();", "      await signInWithGoogle(forcedRole);");
content = content.replace("      setCurrentView('learner');\n    }\n  };", "      if (forcedRole === 'admin') setCurrentView('admin');\n      else setCurrentView('learner');\n    }\n  };");

// replace buttons
const buttonsReplace = `            {user ? (
              <div className="flex gap-2">
              <button 
                onClick={() => handleAuthAction()}
                className="bg-primary hover:bg-primary-light text-white px-5 py-2.5 rounded-full font-semibold text-sm transition-all shadow-md hover:shadow-lg flex items-center gap-2 active:scale-95"
              >
                Dashboard <ArrowRight size={16} />
              </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handleAuthAction('learner')}
                  className="bg-primary hover:bg-primary-light text-white px-5 py-2.5 rounded-full font-semibold text-sm transition-all shadow-md hover:shadow-lg flex items-center gap-2 active:scale-95"
                >
                  Learner <LogIn size={16} />
                </button>
                <button 
                  onClick={() => handleAuthAction('admin')}
                  className="bg-slate-800 hover:bg-slate-900 text-white px-5 py-2.5 rounded-full font-semibold text-sm transition-all shadow-md hover:shadow-lg flex items-center gap-2 active:scale-95 dark:bg-slate-700 dark:hover:bg-slate-600"
                >
                  Admin <ShieldCheck size={16} />
                </button>
              </div>
            )}`;

content = content.replace(/\{user \? \([\s\S]*?\} \/\* Hero Section \*\//, buttonsReplace + "\n          </div>\n        </div>\n      </header>\n\n      {/* Hero Section */}");

// Also in hero section replace handleAuthAction without argument
content = content.replace(/onClick=\{handleAuthAction\}/g, "onClick={() => handleAuthAction('learner')}");

fs.writeFileSync('src/components/LandingPage.tsx', content);
