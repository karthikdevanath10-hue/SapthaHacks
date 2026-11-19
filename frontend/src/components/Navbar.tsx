import React from 'react';
import { ShieldCheck, Database, Sparkles, User, LogOut, UploadCloud, LayoutDashboard } from 'lucide-react';
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
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200/90 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand */}
        <div 
          onClick={() => setCurrentTab('landing')}
          className="flex items-center space-x-3 cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-105 transition">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg tracking-tight text-slate-900">Truth<span className="text-blue-600">Lens</span></span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">ENTERPRISE</span>
            </div>
            <p className="text-[10px] text-slate-500 hidden sm:block font-medium">Multimodal Digital Forensics & Verification</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center space-x-1 sm:space-x-2 bg-slate-100 p-1 rounded-xl border border-slate-200/80">
          <button
            onClick={() => setCurrentTab('studio')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center space-x-1.5 ${
              currentTab === 'studio' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Investigate</span>
          </button>

          <button
            onClick={() => setCurrentTab('dashboard')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center space-x-1.5 ${
              currentTab === 'dashboard' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Audit Trail</span>
          </button>
        </nav>

        {/* System Status Indicators & Auth */}
        <div className="flex items-center space-x-3">
          
          {/* Micro Telemetry Pills */}
          <div className="hidden md:flex items-center space-x-2 text-[11px]">
            <div className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full border ${
              apiStatus.healthy ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-rose-50 border-rose-200 text-rose-700'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${apiStatus.healthy ? 'bg-emerald-500' : 'bg-rose-500'}`} />
              <span className="font-medium text-[11px]">{apiStatus.healthy ? 'Engine Online' : 'Engine Offline'}</span>
            </div>

            <div className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full border ${
              apiStatus.gemini ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-amber-50 border-amber-200 text-amber-700'
            }`}>
              <Sparkles className="w-3 h-3 text-blue-600" />
              <span className="font-medium text-[11px]">{apiStatus.gemini ? 'Gemini 3.6 Active' : 'Heuristic Mode'}</span>
            </div>

            <div className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full border ${
              apiStatus.supabase ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-slate-100 border-slate-200 text-slate-600'
            }`}>
              <Database className="w-3 h-3 text-indigo-600" />
              <span className="font-medium text-[11px]">{apiStatus.supabase ? 'Supabase Synced' : 'Local Storage'}</span>
            </div>
          </div>

          {/* User Auth */}
          {currentUser ? (
            <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-semibold text-slate-800">{currentUser.full_name || currentUser.email}</p>
                <p className="text-[10px] text-blue-600 font-medium">Forensic Analyst</p>
              </div>
              <button 
                onClick={onSignOut}
                title="Sign Out"
                className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 hover:text-rose-600 transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition flex items-center space-x-1.5 cursor-pointer"
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
