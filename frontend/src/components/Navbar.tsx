import React from 'react';
import { ShieldCheck, Eye, Database, Sparkles, User, LogOut, UploadCloud, LayoutDashboard, FileText } from 'lucide-react';
import { UserProfile } from '../types';

interface NavbarProps {
  currentTab: 'studio' | 'dashboard' | 'scorecard' | 'landing';
  setCurrentTab: (tab: 'studio' | 'dashboard' | 'scorecard' | 'landing') => void;
  currentUser: UserProfile | null;
  onOpenAuth: () => void;
  onSignOut: () => void;
  apiStatus: { healthy: boolean; supabase: boolean; gemini: boolean };
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  currentUser,
  onOpenAuth,
  onSignOut,
  apiStatus
}) => {
  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-800/80 bg-[#080c14]/90 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Corporate Brand */}
        <div 
          onClick={() => setCurrentTab('landing')}
          className="flex items-center space-x-3 cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-md shadow-blue-900/40 border border-blue-400/20 group-hover:scale-105 transition">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg tracking-tight text-white">Truth<span className="text-blue-400">Lens</span></span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-950/80 text-blue-300 border border-blue-700/50">ENTERPRISE</span>
            </div>
            <p className="text-[10px] text-slate-400 hidden sm:block tracking-wide">Multimodal Digital Forensics & Verification</p>
          </div>
        </div>

        {/* Corporate Navigation Tabs */}
        <nav className="flex items-center space-x-1 sm:space-x-2 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setCurrentTab('studio')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center space-x-1.5 ${
              currentTab === 'studio' 
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-700/30' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Investigate</span>
          </button>

          <button
            onClick={() => setCurrentTab('dashboard')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center space-x-1.5 ${
              currentTab === 'dashboard' 
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-700/30' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Audit Trail</span>
          </button>
        </nav>

        {/* System Status Indicators & Auth */}
        <div className="flex items-center space-x-3">
          
          {/* Micro Telemetry Pills */}
          <div className="hidden md:flex items-center space-x-2 font-mono text-[11px]">
            <div className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full border ${apiStatus.healthy ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300' : 'bg-rose-950/40 border-rose-500/30 text-rose-300'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${apiStatus.healthy ? 'bg-emerald-400' : 'bg-rose-400'}`} />
              <span className="text-[10px] font-sans font-medium">{apiStatus.healthy ? 'Engine Online' : 'Engine Offline'}</span>
            </div>

            <div className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full border ${apiStatus.gemini ? 'bg-blue-950/40 border-blue-500/30 text-blue-300' : 'bg-amber-950/40 border-amber-500/30 text-amber-300'}`}>
              <Sparkles className="w-3 h-3 text-blue-400" />
              <span className="text-[10px] font-sans font-medium">{apiStatus.gemini ? 'Gemini 3.6 Active' : 'Heuristic Mode'}</span>
            </div>

            <div className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full border ${apiStatus.supabase ? 'bg-indigo-950/40 border-indigo-500/30 text-indigo-300' : 'bg-slate-800/60 border-slate-700 text-slate-400'}`}>
              <Database className="w-3 h-3 text-indigo-400" />
              <span className="text-[10px] font-sans font-medium">{apiStatus.supabase ? 'Supabase Synced' : 'Local Storage'}</span>
            </div>
          </div>

          {/* User Auth */}
          {currentUser ? (
            <div className="flex items-center space-x-2 pl-2 border-l border-slate-800">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-semibold text-slate-200">{currentUser.full_name || currentUser.email}</p>
                <p className="text-[10px] text-blue-400 font-sans">Forensic Analyst</p>
              </div>
              <button 
                onClick={onSignOut}
                title="Sign Out"
                className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="px-3 py-1.5 rounded-md bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold shadow-md shadow-cyan-600/30 transition flex items-center space-x-1.5"
            >
              <User className="w-3.5 h-3.5" />
              <span>Sign In / Demo</span>
            </button>
          )}

        </div>
      </div>
    </header>
  );
};
