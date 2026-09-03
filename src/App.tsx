/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, lazy, Suspense } from 'react';
import { ViewState } from './types';
import { LandingPage } from './components/LandingPage';
import { DashboardLayout } from './components/DashboardLayout';
import { Material3Skeleton } from './components/Material3Skeleton';

const LearnerView = lazy(() => import('./components/LearnerView').then(m => ({ default: m.LearnerView })));
const GeneratorView = lazy(() => import('./components/GeneratorView').then(m => ({ default: m.GeneratorView })));
const AssessmentView = lazy(() => import('./components/AssessmentView').then(m => ({ default: m.AssessmentView })));
const AdminView = lazy(() => import('./components/AdminView').then(m => ({ default: m.AdminView })));

export default function App() {
  const [currentView, setCurrentView] = useState<ViewState>('landing');

  if (currentView === 'landing') {
    return <LandingPage setCurrentView={setCurrentView} />;
  }

  // If in assessment mode, we might want to hide the standard sidebar, 
  // but based on the designs, assessment has a specific header. 
  // We can render AssessmentView completely independently or inside a layout without sidebar.
  // The provided design for Assessment (Image 11) doesn't show a sidebar.
  if (currentView === 'assessment') {
    return (
      <Suspense fallback={
        <div className="p-8 max-w-4xl mx-auto">
          <Material3Skeleton />
        </div>
      }>
        <AssessmentView setCurrentView={setCurrentView} />
      </Suspense>
    );
  }

  return (
    <DashboardLayout currentView={currentView} setCurrentView={setCurrentView}>
      <Suspense fallback={
        <div className="p-8 w-full max-w-6xl mx-auto">
          <Material3Skeleton />
        </div>
      }>
        {currentView === 'learner' && <LearnerView setCurrentView={setCurrentView} />}
        {currentView === 'generator' && <GeneratorView setCurrentView={setCurrentView} />}
        {currentView === 'admin' && <AdminView setCurrentView={setCurrentView} />}
      </Suspense>
    </DashboardLayout>
  );
}
