import React from 'react';

export function Material3Skeleton() {
  return (
    <div className="flex flex-col gap-8 animate-pulse w-full">
      {/* M3 Shimmer Header */}
      <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-2 w-1/3">
          <div className="h-4 bg-[#E7E0EC] dark:bg-[#49454F] rounded-full w-3/4"></div>
          <div className="h-3 bg-[#E8DEF8] dark:bg-[#31111D] rounded-full w-1/2"></div>
        </div>
        <div className="flex gap-2">
          <div className="h-10 bg-[#E8DEF8] dark:bg-[#4A4458] rounded-full w-24"></div>
          <div className="h-10 bg-blue-50 dark:bg-blue-900/50 rounded-full w-24"></div>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {[1, 2, 3].map((index) => (
          <div 
            key={index} 
            className="bg-[#F7F2FA] dark:bg-[#1D1B20] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden flex flex-col lg:flex-row shadow-sm hover:shadow-md transition-shadow duration-300"
          >
            {/* Left Column: M3 Quiz Ingestion/Question Skeleton */}
            <div className="lg:w-3/5 p-6 lg:p-8 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 flex flex-col gap-6">
              <div className="flex items-center gap-3">
                <div className="h-6 bg-blue-50 dark:bg-blue-900/50 rounded-full w-14"></div>
                <div className="h-6 bg-[#E8DEF8] dark:bg-[#4A4458] rounded-full w-28"></div>
              </div>

              <div className="space-y-3">
                <div className="h-4 bg-[#E7E0EC] dark:bg-[#49454F] rounded-full w-5/6"></div>
                <div className="h-4 bg-[#E7E0EC] dark:bg-[#49454F] rounded-full w-4/6"></div>
              </div>

              {/* Distractor/Options list: M3 Rounded Pill Formats */}
              <div className="space-y-3 mt-2">
                {[1, 2, 3, 4].map((o) => (
                  <div key={o} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#E7E0EC] dark:bg-[#49454F] shrink-0"></div>
                    <div className="h-11 bg-white dark:bg-[#2B2930] border border-slate-200 dark:border-slate-800 rounded-full flex-1"></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Explanations & Sources Skeleton */}
            <div className="lg:w-2/5 p-6 lg:p-8 bg-[#ECE6F0] dark:bg-[#25232A] flex flex-col gap-6">
              <div className="space-y-3">
                <div className="h-3 bg-[#E7E0EC] dark:bg-[#49454F] rounded-full w-1/3"></div>
                <div className="h-16 bg-white dark:bg-[#1D1B20] rounded-xl w-full border border-slate-200 dark:border-slate-800"></div>
              </div>

              <div className="space-y-3 flex-1">
                <div className="h-3 bg-[#E7E0EC] dark:bg-[#49454F] rounded-full w-1/2"></div>
                <div className="h-20 bg-blue-50/50 dark:bg-blue-900/50/20 border border-[#EADDFF] dark:border-[#381E72]/40 rounded-xl w-full"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
