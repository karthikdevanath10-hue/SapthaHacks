import React, { useState } from 'react';
import { 
  ShieldCheck, Sparkles, Lock, ArrowRight, User, Mail, 
  Film, Mic, FileText, Globe, Camera, Layers, CheckCircle2, 
  Cpu, AlertCircle, Database, ChevronRight, Play, Terminal
} from 'lucide-react';
import { authService, isSupabaseConfigured } from '../services/supabase';
import { UserProfile } from '../types';

interface WelcomeIntroPageProps {
  onEnterWorkspace: (user?: UserProfile) => void;
  apiStatus: { healthy: boolean; supabase: boolean; gemini: boolean };
}

export const WelcomeIntroPage: React.FC<WelcomeIntroPageProps> = ({ 
  onEnterWorkspace, 
  apiStatus 
}) => {
  const [activeTab, setActiveTab] = useState<'demo' | 'signin' | 'signup'>('demo');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleDemoSignIn = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const demoUser = await authService.signIn('lead.examiner@truthlens.ai');
      onEnterWorkspace(demoUser);
    } catch (err: any) {
      setErrorMsg(err.message || 'Demo initialization failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      let user: UserProfile;
      if (activeTab === 'signup') {
        user = await authService.signUp(email, password, fullName);
      } else {
        user = await authService.signIn(email, password);
      }
      onEnterWorkspace(user);
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070314] text-white relative overflow-x-hidden font-sans selection:bg-purple-500 selection:text-white">
      {/* Background Ambient Glows */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-purple-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-600/10 rounded-full blur-[160px] pointer-events-none" />

      {/* Grid Pattern Overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.4) 1px, transparent 0)`,
          backgroundSize: '36px 36px'
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-16">
        
        {/* ======================================================== */}
        {/* TOP BAR / NAVIGATION */}
        {/* ======================================================== */}
        <header className="flex items-center justify-between py-2 border-b border-purple-500/20">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 via-violet-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/40 ring-1 ring-purple-400/30 flex-shrink-0">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-white drop-shadow-[0_0_12px_rgba(168,85,247,0.5)]">
                Truth<span className="text-purple-400">Lens</span>
              </span>
              <p className="text-[11px] text-purple-300/70">
                Multimodal AI Forensics Lab
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2.5 sm:space-x-4">
            <button
              onClick={() => onEnterWorkspace()}
              className="px-4 py-2 rounded-xl bg-purple-950/60 hover:bg-purple-900/80 border border-purple-500/40 text-purple-200 hover:text-white text-xs font-semibold flex items-center space-x-1.5 transition shadow-[0_0_15px_rgba(168,85,247,0.2)] cursor-pointer"
            >
              <span>Guest Explore</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </header>

        {/* ======================================================== */}
        {/* HERO SECTION + AUTH / DEMO PORTAL (2 COLUMNS) */}
        {/* ======================================================== */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center pt-2 sm:pt-6">
          
          {/* LEFT COLUMN: HERO HEADLINE & INTRO */}
          <div className="lg:col-span-7 space-y-6 text-left">
            {/* Main Headline */}
            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight">
              See Beyond The Pixels. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-violet-300 to-cyan-400 drop-shadow-[0_0_35px_rgba(192,132,252,0.4)]">
                Unmask Synthetic Reality.
              </span>
            </h1>

            {/* Description */}
            <p className="text-purple-200/80 text-base sm:text-lg leading-relaxed max-w-2xl">
              TruthLens is an enterprise multimodal forensic examination suite designed to expose 
              <strong> Generative AI synthesis</strong>, <strong>video deepfakes</strong>, <strong>neural voice clones</strong>, 
              and <strong>synthetic text</strong> through 5 verifiable mathematical and optical layers.
            </p>

            {/* Key Quick Stats / Proofs */}
            <div className="grid grid-cols-3 gap-3 pt-2 max-w-xl">
              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-purple-500/30 backdrop-blur-md">
                <span className="text-xl sm:text-2xl font-extrabold font-mono text-purple-300">5-Axis</span>
                <p className="text-[11px] text-purple-400/70 font-medium">Diagnostic Radar Matrix</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-purple-500/30 backdrop-blur-md">
                <span className="text-xl sm:text-2xl font-extrabold font-mono text-cyan-300">0.01s</span>
                <p className="text-[11px] text-purple-400/70 font-medium">Frame Splicing Precision</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-purple-500/30 backdrop-blur-md">
                <span className="text-xl sm:text-2xl font-extrabold font-mono text-emerald-300">100%</span>
                <p className="text-[11px] text-purple-400/70 font-medium">Verifiable Scorecard Dossier</p>
              </div>
            </div>

            {/* Quick Action Badges */}
            <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-purple-300/80 font-mono">
              <div className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-purple-950/50 border border-purple-500/20">
                <Camera className="w-3.5 h-3.5 text-purple-400" />
                <span>Live Camera Floating Capture</span>
              </div>
              <div className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-purple-950/50 border border-purple-500/20">
                <Globe className="w-3.5 h-3.5 text-cyan-400" />
                <span>MCP Web Presence Scan</span>
              </div>
              <div className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-purple-950/50 border border-purple-500/20">
                <FileText className="w-3.5 h-3.5 text-emerald-400" />
                <span>Official PDF Dossier Export</span>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: AUTHENTICATION & DEMO ACCESS CARD */}
          <div className="lg:col-span-5">
            <div className="bg-slate-950/85 border border-purple-500/40 rounded-3xl p-6 sm:p-7 shadow-[0_0_40px_rgba(168,85,247,0.25)] backdrop-blur-2xl relative overflow-hidden space-y-5">
              
              {/* Corner Ambient Glow */}
              <div className="absolute top-0 right-0 w-44 h-44 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

              {/* Portal Header */}
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <Lock className="w-4 h-4 text-purple-400" />
                  <h3 className="text-lg font-bold text-white">Examiner Access Portal</h3>
                </div>
                <p className="text-xs text-purple-300/70">
                  Select your sign-in method to launch the forensic workspace
                </p>
              </div>

              {/* Tab Selector: Demo vs Sign In vs Sign Up */}
              <div className="grid grid-cols-3 gap-1 bg-slate-900/90 p-1 rounded-xl border border-purple-500/30 text-xs">
                <button
                  type="button"
                  onClick={() => { setActiveTab('demo'); setErrorMsg(null); }}
                  className={`py-2 px-2 rounded-lg font-semibold transition cursor-pointer flex items-center justify-center space-x-1 ${
                    activeTab === 'demo'
                      ? 'bg-purple-600 text-white shadow-[0_0_12px_rgba(168,85,247,0.5)]'
                      : 'text-purple-300/70 hover:text-white hover:bg-purple-950/40'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Demo</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setActiveTab('signin'); setErrorMsg(null); }}
                  className={`py-2 px-2 rounded-lg font-semibold transition cursor-pointer flex items-center justify-center space-x-1 ${
                    activeTab === 'signin'
                      ? 'bg-purple-600 text-white shadow-[0_0_12px_rgba(168,85,247,0.5)]'
                      : 'text-purple-300/70 hover:text-white hover:bg-purple-950/40'
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setActiveTab('signup'); setErrorMsg(null); }}
                  className={`py-2 px-2 rounded-lg font-semibold transition cursor-pointer flex items-center justify-center space-x-1 ${
                    activeTab === 'signup'
                      ? 'bg-purple-600 text-white shadow-[0_0_12px_rgba(168,85,247,0.5)]'
                      : 'text-purple-300/70 hover:text-white hover:bg-purple-950/40'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Sign Up</span>
                </button>
              </div>

              {/* Error Message */}
              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-500/40 text-xs text-rose-300 flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* TAB 1: 1-CLICK DEMO ACCESS (RECOMMENDED) */}
              {activeTab === 'demo' && (
                <div className="space-y-4 pt-1">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-950/50 via-slate-900/80 to-purple-950/30 border border-purple-500/40 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono text-purple-300 font-bold uppercase tracking-wider flex items-center space-x-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span>Instant Evaluator Demo</span>
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40">
                        PS-04 READY
                      </span>
                    </div>

                    <p className="text-xs text-purple-200/80 leading-relaxed">
                      Instant access with the <strong>Lead Forensic Examiner</strong> profile. Pre-configured with sample deepfakes, live WebRTC camera capture, and cloud storage syncing.
                    </p>

                    <div className="text-[11px] font-mono text-purple-400/80 pt-1">
                      Account: <span className="text-white">lead.examiner@truthlens.ai</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleDemoSignIn}
                    disabled={loading}
                    className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-500 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition shadow-[0_0_25px_rgba(168,85,247,0.4)] cursor-pointer group"
                  >
                    <Play className="w-4 h-4 fill-current group-hover:scale-110 transition-transform" />
                    <span>{loading ? 'Initializing Demo Workspace...' : 'Sign In with Demo Option'}</span>
                  </button>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => onEnterWorkspace()}
                      className="text-xs text-purple-400/70 hover:text-purple-300 transition cursor-pointer"
                    >
                      Or continue as Anonymous Guest Analyst →
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2 & 3: FORM SIGN IN / SIGN UP */}
              {(activeTab === 'signin' || activeTab === 'signup') && (
                <form onSubmit={handleFormSubmit} className="space-y-3.5 pt-1">
                  {activeTab === 'signup' && (
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-purple-200">Full Name / Examiner Title</label>
                      <div className="relative">
                        <User className="w-4 h-4 text-purple-400/60 absolute left-3 top-3" />
                        <input
                          type="text"
                          required
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Dr. Jordan Reed"
                          className="w-full bg-slate-900 border border-purple-500/30 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-purple-400/40 focus:border-purple-400 focus:outline-none focus:ring-1 focus:ring-purple-400 transition"
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-purple-200">Email Address</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-purple-400/60 absolute left-3 top-3" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="examiner@truthlens.ai"
                        className="w-full bg-slate-900 border border-purple-500/30 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-purple-400/40 focus:border-purple-400 focus:outline-none focus:ring-1 focus:ring-purple-400 transition"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-purple-200">Password</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-purple-400/60 absolute left-3 top-3" />
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full bg-slate-900 border border-purple-500/30 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-purple-400/40 focus:border-purple-400 focus:outline-none focus:ring-1 focus:ring-purple-400 transition"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition shadow-[0_0_20px_rgba(168,85,247,0.35)] cursor-pointer"
                  >
                    <span>
                      {loading 
                        ? 'Authenticating...' 
                        : activeTab === 'signup' 
                          ? 'Create Account & Enter Workspace' 
                          : 'Sign In & Enter Workspace'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={() => setActiveTab(activeTab === 'signin' ? 'signup' : 'signin')}
                      className="text-xs text-purple-400/70 hover:text-purple-300 font-medium transition cursor-pointer"
                    >
                      {activeTab === 'signin' ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
                    </button>
                  </div>
                </form>
              )}

              <div className="pt-2 border-t border-purple-500/20 text-center">
                <span className="text-[11px] text-purple-400/60">
                  {isSupabaseConfigured 
                    ? 'Protected with Supabase PostgreSQL & Row Level Security' 
                    : 'Protected with Local Sandbox Credentials'}
                </span>
              </div>

            </div>
          </div>

        </section>

        {/* ======================================================== */}
        {/* 5 MULTIMODAL FORENSIC CAPABILITIES SHOWCASE */}
        {/* ======================================================== */}
        <section className="space-y-8 pt-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              Five Modalities • Absolute Forensic Traceability
            </h2>
            <p className="text-xs sm:text-sm text-purple-300/70 max-w-xl mx-auto">
              TruthLens replaces opaque "percentage guessing" with verifiable mathematical proof across five independent modalities.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            
            {/* Card 1: Image */}
            <div className="p-5 rounded-2xl bg-slate-950/70 border border-purple-500/30 hover:border-purple-400 transition-all hover:-translate-y-1 group backdrop-blur-md space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-900/50 border border-purple-500/40 flex items-center justify-center text-purple-300 group-hover:scale-110 transition-transform">
                <Camera className="w-5 h-5 text-purple-300" />
              </div>
              <h4 className="text-sm font-bold text-white">1. Image Forensics</h4>
              <p className="text-xs text-purple-300/70 leading-relaxed">
                Error Level Analysis (ELA 90%), sensor noise variance, generative AI diffusion artifacts, and color gamut profiling.
              </p>
            </div>

            {/* Card 2: Video */}
            <div className="p-5 rounded-2xl bg-slate-950/70 border border-purple-500/30 hover:border-purple-400 transition-all hover:-translate-y-1 group backdrop-blur-md space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-900/50 border border-purple-500/40 flex items-center justify-center text-purple-300 group-hover:scale-110 transition-transform">
                <Film className="w-5 h-5 text-cyan-300" />
              </div>
              <h4 className="text-sm font-bold text-white">2. Video Deepfakes</h4>
              <p className="text-xs text-purple-300/70 leading-relaxed">
                Temporal frame discontinuity timeline with exact seconds of cuts, facial landmark micro-jitter, and audio-video desync.
              </p>
            </div>

            {/* Card 3: Audio */}
            <div className="p-5 rounded-2xl bg-slate-950/70 border border-purple-500/30 hover:border-purple-400 transition-all hover:-translate-y-1 group backdrop-blur-md space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-900/50 border border-purple-500/40 flex items-center justify-center text-purple-300 group-hover:scale-110 transition-transform">
                <Mic className="w-5 h-5 text-indigo-300" />
              </div>
              <h4 className="text-sm font-bold text-white">3. Audio / Voice</h4>
              <p className="text-xs text-purple-300/70 leading-relaxed">
                Synthetic speech detection, neural cloning spectral cutoffs, unnatural phase trajectories, and robotic pitch cadence.
              </p>
            </div>

            {/* Card 4: Text */}
            <div className="p-5 rounded-2xl bg-slate-950/70 border border-purple-500/30 hover:border-purple-400 transition-all hover:-translate-y-1 group backdrop-blur-md space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-900/50 border border-purple-500/40 flex items-center justify-center text-purple-300 group-hover:scale-110 transition-transform">
                <FileText className="w-5 h-5 text-emerald-300" />
              </div>
              <h4 className="text-sm font-bold text-white">4. Text Provenance</h4>
              <p className="text-xs text-purple-300/70 leading-relaxed">
                Algorithmic perplexity analysis, repetitive burstiness scoring, and LLM text watermarking detection.
              </p>
            </div>

            {/* Card 5: OSINT Provenance */}
            <div className="p-5 rounded-2xl bg-slate-950/70 border border-purple-500/30 hover:border-purple-400 transition-all hover:-translate-y-1 group backdrop-blur-md space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-900/50 border border-purple-500/40 flex items-center justify-center text-purple-300 group-hover:scale-110 transition-transform">
                <Globe className="w-5 h-5 text-rose-300" />
              </div>
              <h4 className="text-sm font-bold text-white">5. MCP Web OSINT</h4>
              <p className="text-xs text-purple-300/70 leading-relaxed">
                Cross-platform reverse web presence tracing across X, Instagram, Reddit, and global news syndicate registries.
              </p>
            </div>

          </div>
        </section>

        {/* ======================================================== */}
        {/* BOTTOM ACTION CTA BANNER */}
        {/* ======================================================== */}
        <section className="p-8 sm:p-10 rounded-3xl bg-gradient-to-r from-purple-950/80 via-slate-950 to-indigo-950/80 border border-purple-500/40 shadow-[0_0_40px_rgba(168,85,247,0.2)] text-center space-y-4">
          <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
            Ready to Begin Forensic Analysis?
          </h3>
          <p className="text-xs sm:text-sm text-purple-200/80 max-w-xl mx-auto">
            Experience real-time live camera capture, video temporal splice detection, and automated Dossier export.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={handleDemoSignIn}
              disabled={loading}
              className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase tracking-wider flex items-center space-x-2 shadow-[0_0_20px_rgba(168,85,247,0.4)] transition cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Launch 1-Click Demo Option</span>
            </button>
            <button
              onClick={() => onEnterWorkspace()}
              className="px-6 py-3 rounded-xl border border-purple-500/40 bg-slate-900/80 hover:bg-slate-900 text-purple-300 hover:text-white font-semibold text-xs transition cursor-pointer"
            >
              <span>Explore as Guest Analyst</span>
            </button>
          </div>
        </section>

        {/* ======================================================== */}
        {/* FOOTER */}
        {/* ======================================================== */}
        <footer className="pt-4 border-t border-purple-500/20 flex flex-col sm:flex-row items-center justify-between text-xs text-purple-400/60 gap-2">
          <span>TruthLens Multimodal Forensic Engine • Problem Statement PS-04</span>
          <span>Scientific Traceability • Google Gemini & OpenCV Core</span>
        </footer>

      </div>
    </div>
  );
};
