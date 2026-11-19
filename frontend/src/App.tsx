import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { NewInvestigationIntake } from './components/NewInvestigationIntake';
import { ForensicAnalysisResults } from './components/ForensicAnalysisResults';
import { DashboardView } from './components/DashboardView';
import { SettingsView } from './components/SettingsView';
import { AuthModal } from './components/AuthModal';
import { UserProfile, FullAnalysisResponse } from './types';
import { authService } from './services/supabase';
import { apiService } from './services/api';
import { Eye, ArrowLeft, Shield } from 'lucide-react';

export function App() {
  const [currentTab, setCurrentTab] = useState<'landing' | 'studio' | 'dashboard' | 'scorecard' | 'settings'>('landing');
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [inspectingAnalysis, setInspectingAnalysis] = useState<FullAnalysisResponse | null>(null);

  const [apiStatus, setApiStatus] = useState({
    healthy: false,
    supabase: false,
    gemini: false
  });

  const checkHealthStatus = async () => {
    try {
      const health = await apiService.checkHealth();
      setApiStatus({
        healthy: health.status === 'healthy',
        supabase: Boolean(health.supabase_connected),
        gemini: Boolean(health.gemini_configured)
      });
    } catch {
      setApiStatus({
        healthy: false,
        supabase: false,
        gemini: false
      });
    }
  };

  // Check health and load user session on mount
  useEffect(() => {
    const initApp = async () => {
      // User check
      const user = await authService.getCurrentUser();
      if (user) setCurrentUser(user);

      // Backend API health check
      await checkHealthStatus();
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
    <div className="min-h-screen bg-[#080F1F] flex flex-col text-slate-100 selection:bg-cyan-500 selection:text-black font-sans">
      
      {/* Top Navigation */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={(tab) => {
          if (tab !== 'scorecard') {
            setInspectingAnalysis(null);
          }
          setCurrentTab(tab);
        }}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthOpen(true)}
        onSignOut={handleSignOut}
        apiStatus={apiStatus}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 w-full">
        
        {/* Landing Page */}
        {currentTab === 'landing' && (
          <LandingPage onStart={() => setCurrentTab('studio')} />
        )}

        {/* New Investigation Intake Studio */}
        {currentTab === 'studio' && (
          <NewInvestigationIntake 
            currentUser={currentUser} 
            onAnalysisComplete={(res) => {
              setInspectingAnalysis(res);
              setCurrentTab('scorecard');
            }}
          />
        )}

        {/* Dashboard History */}
        {currentTab === 'dashboard' && (
          <DashboardView
            onOpenInvestigation={handleOpenInvestigationDetails}
            onNewInvestigation={() => {
              setInspectingAnalysis(null);
              setCurrentTab('studio');
            }}
          />
        )}

        {/* Flagship Forensic Analysis Results Dossier View */}
        {currentTab === 'scorecard' && inspectingAnalysis && (
          <div className="space-y-4 pb-12">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <button
                onClick={() => setCurrentTab('dashboard')}
                className="px-3 py-1.5 rounded-lg border border-white/10 bg-[#101B2D] text-slate-300 hover:text-white text-xs font-semibold flex items-center space-x-2 transition cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Dossier Registry</span>
              </button>

              <button
                onClick={() => {
                  setInspectingAnalysis(null);
                  setCurrentTab('studio');
                }}
                className="px-3 py-1.5 rounded-lg bg-blue-600/30 border border-blue-500/40 text-cyan-300 hover:text-white text-xs font-semibold flex items-center space-x-2 transition cursor-pointer"
              >
                <span>+ New Investigation</span>
              </button>
            </div>

            <ForensicAnalysisResults 
              analysis={inspectingAnalysis} 
              onNewInvestigation={() => {
                setInspectingAnalysis(null);
                setCurrentTab('studio');
              }}
            />
          </div>
        )}

        {/* Settings & Telemetry View */}
        {currentTab === 'settings' && (
          <SettingsView 
            apiStatus={apiStatus}
            onRefreshHealth={checkHealthStatus}
          />
        )}

      </main>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={(user) => setCurrentUser(user)}
      />

      {/* Footer */}
      <footer className="border-t border-white/10 bg-[#080F1F]/95 py-8 mt-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <Eye className="w-4 h-4 text-cyan-400" />
            <span className="font-bold text-slate-300 tracking-wider font-mono">TRUTHLENS</span>
            <span>• Problem Statement PS04 Multimodal Digital Forensics</span>
          </div>

          <div className="flex items-center space-x-4 text-[11px] font-mono">
            <span>FastAPI + OpenCV</span>
            <span>•</span>
            <span>Google Gemini 3.5 Flash</span>
            <span>•</span>
            <span>Supabase PostgreSQL</span>
          </div>
        </div>
      </footer>

    </div>
  );
}

export default App;
