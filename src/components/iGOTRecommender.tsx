import React from 'react';
import { ExternalLink, BookOpen, AlertCircle } from 'lucide-react';

export interface SkillGap {
  axis: string;
  delta: number;
  evaluatedScore: number;
  targetScore: number;
}

const COURSE_MAPPING: Record<string, { courseId: string; title: string; duration: string }> = {
  "Sampling": { courseId: "igot-mospi-sam-402", title: "Advanced Survey Sampling & Neyman Allocation", duration: "2h 30m" },
  "Accounts": { courseId: "igot-mospi-acc-101", title: "System of National Accounts (SNA) Foundations", duration: "4h 00m" },
  "Indices": { courseId: "igot-mospi-ind-305", title: "CPI & IIP Inflation Calculation Mechanics", duration: "1h 45m" },
  "Python/R": { courseId: "igot-mospi-py-202", title: "Data Analytics with Python for Official Statistics", duration: "5h 15m" },
  "GIS": { courseId: "igot-mospi-gis-501", title: "Spatial Analytics & Satellite Framing in FOD", duration: "3h 00m" },
  "Governance": { courseId: "igot-mospi-gov-108", title: "DPDP Act 2023 & Microdata Anonymization Protocol", duration: "1h 30m" },
  "Quality": { courseId: "igot-mospi-qua-204", title: "Statistical Disclosure Control (SDC) Standards", duration: "2h 15m" },
  "Field Ops": { courseId: "igot-mospi-fld-102", title: "NSSO FOD Enumeration & Dispute Mitigation", duration: "3h 30m" }
};

export const generateiGOTDeepLink = (axis: string): string => {
  // Encodes topic search so officers land on live courses
  const searchQuery = encodeURIComponent(`MoSPI ${axis}`);
  return `https://igotkarmayogi.gov.in/app/search?q=${searchQuery}&source=statiq_mospi`;
};

export const IGOTRecommenderCard: React.FC<{ gaps: SkillGap[] }> = ({ gaps }) => {
  if (!gaps || gaps.length === 0) {
    return (
      <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 rounded-2xl border border-emerald-200 dark:border-emerald-900/30">
        🎉 All competencies meet or exceed the target FRAC baseline score!
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
        <AlertCircle className="w-5 h-5 text-amber-500" />
        Recommended Remedial Training (iGOT Karmayogi)
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {gaps.map((gap) => {
          const course = COURSE_MAPPING[gap.axis];
          if (!course) return null;
          const deepLink = generateiGOTDeepLink(gap.axis);

          return (
            <div key={gap.axis} className="p-5 bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-2">
                <span className="px-2.5 py-0.5 text-xs font-semibold bg-amber-100 dark:bg-amber-950/40 text-amber-850 dark:text-amber-300 rounded-full">
                  Deficit: -{gap.delta.toFixed(1)} pts ({gap.axis})
                </span>
                <span className="text-xs text-slate-400 dark:text-slate-500">{course.duration}</span>
              </div>
              <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-sm mb-1">{course.title}</h4>
              <p className="text-xs text-slate-500 dark:text-slate-450 mb-3">Targeting proficiency boost in {gap.axis}.</p>
              <a
                href={deepLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
              >
                <BookOpen className="w-3.5 h-3.5" />
                Search Course on iGOT Karmayogi
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          );
        })}
      </div>
    </div>
  );
};
