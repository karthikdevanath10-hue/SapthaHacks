import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { UploadStudio } from './components/UploadStudio';
import { DashboardView } from './components/DashboardView';
import { AuthModal } from './components/AuthModal';
import { EvidenceScorecardView } from './components/EvidenceScorecardView';
import { UserProfile, FullAnalysisResponse } from './types';
import { authService } from './services/supabase';
import { apiService } from './services/api';
import { Eye, Shield, Terminal, ArrowLeft } from 'lucide-react';

export function App() {
  const [currentTab, setCurrentTab] = useState<'landing' | 'studio' | 'dashboard' | 'scorecard'>('landing');
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [inspectingAnalysis, setInspectingAnalysis] = useState<FullAnalysisResponse | null>(null);

  const [apiStatus, setApiStatus] = useState({
    healthy: false,
    supabase: false,
    gemini: false
  });

  // Check health and load user session on mount
  useEffect(() => {
    const initApp = async () => {
      // User check
      const user = await authService.getCurrentUser();
      if (user) setCurrentUser(user);

      // Backend API health check
      const health = await apiService.checkHealth();
      setApiStatus({
        healthy: health.status === 'healthy',
        supabase: Boolean(health.supabase_connected),
        gemini: Boolean(health.gemini_configured)
      });
    };

    initApp();
  }, []);

  const handleOpenInvestigationDetails = async (id: string) => {
    try {
      const details = await apiService.getInvestigationDetails(id);
      setInspectingAnalysis(details);
      setCurrentTab('scorecard');
    } catch (e) {
      alert('Could not retrieve investigation details.');
    }
  };

  const handleSignOut = async () => {
    await authService.signOut();
    setCurrentUser(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800 selection:bg-blue-600 selection:text-white">
      
      {/* Top Navigation */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={(tab) => {
          setInspectingAnalysis(null);
          setCurrentTab(tab);
        }}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthOpen(true)}
        onSignOut={handleSignOut}
        apiStatus={apiStatus}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 w-full">
        
        {/* Landing Page */}
        {currentTab === 'landing' && (
          <LandingPage onStart={() => setCurrentTab('studio')} />
        )}

        {/* Upload & Forensics Studio */}
        {currentTab === 'studio' && (
          <UploadStudio 
            currentUser={currentUser} 
            onAnalysisComplete={(res) => {
              // Stay in studio view or set state
            }}
          />
        )}

        {/* Dashboard History */}
        {currentTab === 'dashboard' && (
          <DashboardView
            onOpenInvestigation={handleOpenInvestigationDetails}
            onNewInvestigation={() => setCurrentTab('studio')}
          />
        )}

        {/* Specific Investigation Inspection View */}
        {currentTab === 'scorecard' && inspectingAnalysis && (
          <div className="space-y-6 pb-12">
            <button
              onClick={() => setCurrentTab('dashboard')}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-50 text-xs font-semibold flex items-center space-x-2 shadow-sm transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Case Dashboard</span>
            </button>
            <EvidenceScorecardView analysis={inspectingAnalysis} />
          </div>
        )}

      </main>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={(user) => setCurrentUser(user)}
      />

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 mt-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <Eye className="w-4 h-4 text-blue-600" />
            <span className="font-bold text-slate-900 tracking-wider">TRUTHLENS</span>
            <span>• Problem Statement PS04 Digital Forensics System</span>
          </div>

          <div className="flex items-center space-x-4 text-[11px] font-mono text-slate-500">
            <span>FastAPI + OpenCV</span>
            <span>•</span>
            <span>Google Gemini</span>
            <span>•</span>
            <span>Supabase PostgreSQL</span>
          </div>
        </div>
      </footer>

    </div>
  );
}

export default App;
