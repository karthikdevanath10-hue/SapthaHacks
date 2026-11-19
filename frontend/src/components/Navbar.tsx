import React from 'react';
import { Eye, Database, Sparkles, User, LogOut, UploadCloud, LayoutDashboard, Shield, Lock, Settings } from 'lucide-react';
import { UserProfile } from '../types';

interface NavbarProps {
  currentTab: 'studio' | 'dashboard' | 'scorecard' | 'landing' | 'settings';
  setCurrentTab: (tab: 'studio' | 'dashboard' | 'scorecard' | 'landing' | 'settings') => void;
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
    <header className="sticky top-0 z-50 bg-[#080F1F]/90 backdrop-blur-md border-b border-white/10 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand */}
        <div 
          onClick={() => setCurrentTab('landing')}
          className="flex items-center space-x-3 cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-all">
            <Eye className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-lg tracking-wider text-white font-mono">TRUTH<span className="text-cyan-400">LENS</span></span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800 font-mono font-bold">V4.8</span>
            </div>
            <p className="text-[10px] text-slate-400 hidden sm:block font-mono">Multimodal Forensics & Deepfake Detection</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center space-x-1 sm:space-x-2">
          <button
            onClick={() => setCurrentTab('landing')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              currentTab === 'landing' 
                ? 'bg-blue-600/20 text-cyan-300 border border-cyan-500/30' 
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Overview
          </button>

          <button
            onClick={() => setCurrentTab('studio')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center space-x-1.5 ${
              currentTab === 'studio' 
                ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-600/30' 
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>New Case</span>
          </button>

          <button
            onClick={() => setCurrentTab('dashboard')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center space-x-1.5 ${
              currentTab === 'dashboard' 
                ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-600/30' 
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Dossier Registry</span>
          </button>

          <button
            onClick={() => setCurrentTab('settings')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center space-x-1.5 ${
              currentTab === 'settings' 
                ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-600/30' 
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Settings</span>
          </button>
        </nav>

        {/* System Status Indicators & Auth */}
        <div className="flex items-center space-x-3">
          
          {/* Micro Telemetry Pills */}
          <div className="hidden lg:flex items-center space-x-2 font-mono text-[10px]">
            <div className={`flex items-center space-x-1 px-2 py-0.5 rounded-full border ${apiStatus.healthy ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-400' : 'bg-rose-950/60 border-rose-500/40 text-rose-400'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${apiStatus.healthy ? 'bg-emerald-400' : 'bg-rose-400'} animate-ping`} />
              <span>CORE {apiStatus.healthy ? 'ONLINE' : 'OFFLINE'}</span>
            </div>

            <div className={`flex items-center space-x-1 px-2 py-0.5 rounded-full border ${apiStatus.gemini ? 'bg-cyan-950/60 border-cyan-500/40 text-cyan-300' : 'bg-amber-950/60 border-amber-500/40 text-amber-300'}`}>
              <Sparkles className="w-3 h-3" />
              <span>{apiStatus.gemini ? 'GEMINI 3.5' : 'OFFLINE'}</span>
            </div>

            <div className={`flex items-center space-x-1 px-2 py-0.5 rounded-full border ${apiStatus.supabase ? 'bg-blue-950/60 border-blue-500/40 text-blue-300' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
              <Database className="w-3 h-3" />
              <span>{apiStatus.supabase ? 'VAULT ACTIVE' : 'LOCAL STORE'}</span>
            </div>
          </div>

          {/* User Profile */}
          {currentUser ? (
            <div className="flex items-center space-x-2 pl-2 border-l border-white/10">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-semibold text-slate-200">{currentUser.full_name || currentUser.email}</p>
                <p className="text-[9px] text-cyan-400 font-mono">Lead Examiner</p>
              </div>
              <button 
                onClick={onSignOut}
                title="Sign Out"
                className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-rose-400 transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/30 transition flex items-center space-x-1.5"
            >
              <User className="w-3.5 h-3.5" />
              <span>Examiner Login</span>
            </button>
          )}

        </div>
      </div>
    </header>
  );
};
