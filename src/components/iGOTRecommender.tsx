import React from 'react';
import { ExternalLink, BookOpen, AlertCircle, TrendingUp, Clock, ChevronRight } from 'lucide-react';

export interface SkillGap {
  axis: string;
  delta: number;
  evaluatedScore: number;
  targetScore: number;
}

const COURSE_MAPPING: Record<string, { courseId: string; title: string; duration: string; level: string }> = {
  "Sampling": { courseId: "igot-mospi-sam-402", title: "Advanced Survey Sampling & Neyman Allocation", duration: "2h 30m", level: "Advanced" },
  "Accounts": { courseId: "igot-mospi-acc-101", title: "System of National Accounts (SNA) Foundations", duration: "4h 00m", level: "Intermediate" },
  "Indices": { courseId: "igot-mospi-ind-305", title: "CPI & IIP Inflation Calculation Mechanics", duration: "1h 45m", level: "Advanced" },
  "Python/R": { courseId: "igot-mospi-py-202", title: "Data Analytics with Python for Official Statistics", duration: "5h 15m", level: "Beginner" },
  "GIS": { courseId: "igot-mospi-gis-501", title: "Spatial Analytics & Satellite Framing in FOD", duration: "3h 00m", level: "Advanced" },
  "Governance": { courseId: "igot-mospi-gov-108", title: "DPDP Act 2023 & Microdata Anonymization Protocol", duration: "1h 30m", level: "Foundational" },
  "Quality": { courseId: "igot-mospi-qua-204", title: "Statistical Disclosure Control (SDC) Standards", duration: "2h 15m", level: "Intermediate" },
  "Field Ops": { courseId: "igot-mospi-fld-102", title: "NSSO FOD Enumeration & Dispute Mitigation", duration: "3h 30m", level: "Intermediate" }
};

export const generateiGOTDeepLink = (axis: string): string => {
  // Point directly to the specific micro module course overview on the valid portal domain
  const course = COURSE_MAPPING[axis];
  if (course) {
    return `https://portal.igotkarmayogi.gov.in/app/toc/${course.courseId}/overview`;
  }
  const searchQuery = encodeURIComponent(axis);
  return `https://portal.igotkarmayogi.gov.in/app/search?q=${searchQuery}`;
};

export const IGOTRecommenderCard: React.FC<{ gaps: SkillGap[], courseProgress?: Record<string, any> }> = ({ gaps, courseProgress = {} }) => {
  if (!gaps || gaps.length === 0) {
    return (
      <div className="p-8 bg-emerald-50/50 dark:bg-emerald-950/10 text-emerald-800 dark:text-emerald-300 rounded-xl border border-emerald-100 dark:border-emerald-900/30 shadow-sm flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 bg-emerald-100/60 dark:bg-emerald-900/40 rounded-full flex items-center justify-center mb-4">
          <TrendingUp className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h4 className="text-lg font-bold mb-1">Excellent Proficiency</h4>
        <p className="text-sm opacity-90 max-w-sm">All your competencies meet or exceed the target FRAC baseline score! Keep up the great work.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100 dark:border-slate-800/60">
        <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2 tracking-tight">
          <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          Recommended Remedial Training
        </h3>
        <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200/40 dark:border-slate-700/50 rounded-md self-start sm:self-auto">
          Provided by iGOT Karmayogi
        </span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {gaps.map((gap) => {
          const course = COURSE_MAPPING[gap.axis];
          if (!course) return null;
          
          const deepLink = generateiGOTDeepLink(gap.axis);
          const progress = courseProgress[course.courseId];
          
          return (
            <div 
              key={gap.axis} 
              className="group p-6 bg-slate-50/40 dark:bg-slate-900/20 rounded-xl border border-slate-200/60 dark:border-slate-800/80 hover:border-indigo-200 dark:hover:border-indigo-900/50 hover:bg-white dark:hover:bg-slate-900 transition-all duration-300 flex flex-col justify-between shadow-sm hover:shadow-md"
            >
              <div>
                {/* Header Metadata row */}
                <div className="flex items-center justify-between gap-2 mb-4">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border border-amber-200/30 dark:border-amber-900/30 rounded-md">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Gap: -{gap.delta.toFixed(1)} pts
                  </span>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 rounded">
                    {course.level}
                  </span>
                </div>
                
                {/* Course Title */}
                <h4 className="font-bold text-slate-900 dark:text-slate-100 text-[15px] leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors mb-2">
                  {course.title}
                </h4>
                
                {/* Course Description */}
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-5">
                  This course will help boost your proficiency in <strong className="text-slate-700 dark:text-slate-300 font-semibold">{gap.axis}</strong> to meet the required FRAC baseline standard.
                </p>
              </div>

              <div className="space-y-4">
                {/* Progress bar section if synchronized */}
                {progress && (
                  <div className="pt-2">
                    <div className="flex justify-between items-center text-[11px] mb-1.5 font-semibold">
                      <span className="text-slate-500 dark:text-slate-400">{progress.status}</span>
                      <span className="text-indigo-600 dark:text-indigo-400">{progress.completionPercentage}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className={`h-1.5 rounded-full transition-all duration-500 ${progress.completionPercentage === 100 ? 'bg-emerald-500' : 'bg-indigo-600 dark:bg-indigo-400'}`}
                        style={{ width: `${progress.completionPercentage}%` }}
                      ></div>
                    </div>
                  </div>
                )}
                
                {/* Footer Controls & Stats */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800/80">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{course.duration}</span>
                  </div>
                  
                  <a
                    href={deepLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 bg-indigo-50/80 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 px-4 py-2 rounded-lg transition-all"
                  >
                    Explore Course
                    <ChevronRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
