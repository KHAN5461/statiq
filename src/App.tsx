/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, lazy, Suspense, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { LandingPage } from './components/LandingPage';
import { DashboardLayout } from './components/DashboardLayout';
import { Material3Skeleton } from './components/Material3Skeleton';

const LearnerView = lazy(() => import('./components/LearnerView').then(m => ({ default: m.LearnerView })));
const GeneratorView = lazy(() => import('./components/GeneratorView').then(m => ({ default: m.GeneratorView })));
const AssessmentView = lazy(() => import('./components/AssessmentView').then(m => ({ default: m.AssessmentView })));
const AdminView = lazy(() => import('./components/AdminView').then(m => ({ default: m.AdminView })));

export default function App() {
  const [activeAssessment, setActiveAssessment] = useState<any>(() => {
    const saved = localStorage.getItem('activeAssessment');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  useEffect(() => {
    if (activeAssessment) {
      localStorage.setItem('activeAssessment', JSON.stringify(activeAssessment));
    } else {
      localStorage.removeItem('activeAssessment');
    }
  }, [activeAssessment]);

  return (
    <Routes>
      {/* Public / Landing */}
      <Route path="/" element={<LandingPage />} />
      
      {/* Assessment Runner (Fullscreen) */}
      <Route path="/assessment" element={
        <Suspense fallback={<div className="p-8 max-w-4xl mx-auto"><Material3Skeleton /></div>}>
          <AssessmentView activeAssessment={activeAssessment} />
        </Suspense>
      } />
      <Route path="/assessment/:id" element={
        <Suspense fallback={<div className="p-8 max-w-4xl mx-auto"><Material3Skeleton /></div>}>
          <AssessmentView activeAssessment={activeAssessment} />
        </Suspense>
      } />

      {/* Authenticated / Dashboard Layout */}
      <Route element={<DashboardLayout />}>
        {/* Learner Routes */}
        <Route path="/learner/*" element={
          <Suspense fallback={<div className="p-8 w-full max-w-6xl mx-auto"><Material3Skeleton /></div>}>
            <LearnerView />
          </Suspense>
        } />
        
        {/* Admin Routes */}
        <Route path="/admin/*" element={
          <Suspense fallback={<div className="p-8 w-full max-w-6xl mx-auto"><Material3Skeleton /></div>}>
            <AdminView />
          </Suspense>
        } />
        
        {/* Authoring Routes */}
        <Route path="/authoring/generator" element={
          <Suspense fallback={<div className="p-8 w-full max-w-6xl mx-auto"><Material3Skeleton /></div>}>
            <GeneratorView setActiveAssessment={setActiveAssessment} />
          </Suspense>
        } />
      </Route>
    </Routes>
  );
}
