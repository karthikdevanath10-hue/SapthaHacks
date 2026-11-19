import React, { useState, useEffect } from 'react';
import { PageExplorerLayout } from './components/PageExplorerLayout';
import { EvidenceScorecardView } from './components/EvidenceScorecardView';
import { AuthModal } from './components/AuthModal';
import { UserProfile, FullAnalysisResponse } from './types';
import { authService } from './services/supabase';
import { apiService } from './services/api';
import { ArrowLeft } from 'lucide-react';

export function App() {
  const [inspectingAnalysis, setInspectingAnalysis] = useState<FullAnalysisResponse | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  const [apiStatus, setApiStatus] = useState({
    healthy: false,
    supabase: false,
    gemini: false
  });

  useEffect(() => {
    const initApp = async () => {
      const user = await authService.getCurrentUser();
      if (user) setCurrentUser(user);

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
    } catch (e) {
      alert('Could not retrieve investigation details.');
    }
  };

  const handleSignOut = async () => {
    await authService.signOut();
    setCurrentUser(null);
  };

  if (inspectingAnalysis) {
    return (
      <div className="min-h-screen bg-[#070314] text-white p-6 sm:p-10 space-y-6">
        <button
          onClick={() => setInspectingAnalysis(null)}
          className="px-4 py-2 rounded-xl border border-purple-500/40 bg-purple-950/40 text-purple-300 hover:text-white hover:border-purple-400 text-xs font-semibold flex items-center space-x-2 shadow-sm transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Page Explorer</span>
        </button>
        <div className="max-w-7xl mx-auto">
          <EvidenceScorecardView analysis={inspectingAnalysis} />
        </div>
      </div>
    );
  }

  return (
    <>
      <PageExplorerLayout
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthOpen(true)}
        onSignOut={handleSignOut}
        onOpenInvestigation={handleOpenInvestigationDetails}
        onInspectResult={(res) => setInspectingAnalysis(res)}
        apiStatus={apiStatus}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={(user) => setCurrentUser(user)}
      />
    </>
  );
}

export default App;
