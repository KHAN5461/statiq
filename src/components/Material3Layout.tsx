import React from 'react';

interface Material3LayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export function Material3Layout({ children, title, subtitle }: Material3LayoutProps) {
  return (
    <div className="flex flex-col flex-1 w-full bg-[#FDF7FF] dark:bg-[#141218] min-h-0 text-[#1C1B1F] dark:text-[#E6E1E5]">
      {/* Main Content Pane */}
      <main id="main-content" className="flex-1 overflow-y-auto focus:outline-none">
        {children}
      </main>
    </div>
  );
}
