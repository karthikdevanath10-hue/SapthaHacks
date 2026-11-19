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
    <header className="sticky top-0 z-50 glass-panel border-b border-cyan-500/20 bg-cyber-950/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand */}
        <div 
          onClick={() => setCurrentTab('landing')}
          className="flex items-center space-x-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-400/40 transition">
            <Eye className="w-6 h-6 text-white animate-pulse-glow" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-xl tracking-wider text-white">TRUTH<span className="text-cyan-400">LENS</span></span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 font-mono">PS04</span>
            </div>
            <p className="text-[10px] text-slate-400 hidden sm:block">AI Multimodal Digital Forensics</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center space-x-1 sm:space-x-2">
          <button
            onClick={() => setCurrentTab('studio')}
            className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition flex items-center space-x-1.5 ${
              currentTab === 'studio' 
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' 
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <UploadCloud className="w-4 h-4 text-cyan-400" />
            <span>Investigate</span>
          </button>

          <button
            onClick={() => setCurrentTab('dashboard')}
            className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition flex items-center space-x-1.5 ${
              currentTab === 'dashboard' 
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' 
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 text-cyan-400" />
            <span>Dashboard</span>
          </button>
        </nav>

        {/* System Status Indicators & Auth */}
        <div className="flex items-center space-x-3">
          
          {/* Micro Telemetry Pills */}
          <div className="hidden md:flex items-center space-x-2 font-mono text-[11px]">
            <div className={`flex items-center space-x-1 px-2 py-0.5 rounded-full border ${apiStatus.healthy ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-400' : 'bg-rose-950/60 border-rose-500/40 text-rose-400'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${apiStatus.healthy ? 'bg-emerald-400' : 'bg-rose-400'} animate-ping`} />
              <span>API {apiStatus.healthy ? 'ONLINE' : 'OFFLINE'}</span>
            </div>

            <div className={`flex items-center space-x-1 px-2 py-0.5 rounded-full border ${apiStatus.gemini ? 'bg-cyan-950/60 border-cyan-500/40 text-cyan-300' : 'bg-amber-950/60 border-amber-500/40 text-amber-300'}`}>
              <Sparkles className="w-3 h-3" />
              <span>{apiStatus.gemini ? 'GEMINI 1.5' : 'AI HEURISTIC'}</span>
            </div>

            <div className={`flex items-center space-x-1 px-2 py-0.5 rounded-full border ${apiStatus.supabase ? 'bg-blue-950/60 border-blue-500/40 text-blue-300' : 'bg-slate-800/60 border-slate-700 text-slate-400'}`}>
              <Database className="w-3 h-3" />
              <span>{apiStatus.supabase ? 'SUPABASE' : 'LOCAL DB'}</span>
            </div>
          </div>

          {/* User Auth */}
          {currentUser ? (
            <div className="flex items-center space-x-2 pl-2 border-l border-slate-800">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-medium text-slate-200">{currentUser.full_name || currentUser.email}</p>
                <p className="text-[10px] text-cyan-400 font-mono">Digital Examiner</p>
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
