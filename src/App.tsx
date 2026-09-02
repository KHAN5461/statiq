/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ViewState } from './types';
import { LandingPage } from './components/LandingPage';
import { DashboardLayout } from './components/DashboardLayout';
import { LearnerView } from './components/LearnerView';
import { GeneratorView } from './components/GeneratorView';
import { AssessmentView } from './components/AssessmentView';
import { AdminView } from './components/AdminView';

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
    return <AssessmentView setCurrentView={setCurrentView} />;
  }

  return (
    <DashboardLayout currentView={currentView} setCurrentView={setCurrentView}>
      {currentView === 'learner' && <LearnerView setCurrentView={setCurrentView} />}
      {currentView === 'generator' && <GeneratorView setCurrentView={setCurrentView} />}
      {currentView === 'admin' && <AdminView setCurrentView={setCurrentView} />}
    </DashboardLayout>
  );
}
