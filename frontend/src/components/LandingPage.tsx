import React from 'react';
import { 
  ShieldCheck, Eye, Layers, Sparkles, Binary, MessageSquare, 
  ArrowRight, FileCheck, CheckCircle2, Lock, Cpu, Database, PanelLeftOpen 
} from 'lucide-react';

interface LandingPageProps {
  onStart: () => void;
  onOpenDashboard?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStart, onOpenDashboard }) => {
  return (
    <div className="space-y-20 pb-20 max-w-7xl mx-auto">
      
      {/* Hero Section */}
      <section className="relative pt-12 lg:pt-20 text-center space-y-6">
        <div className="absolute inset-0 max-w-3xl mx-auto h-72 bg-gradient-to-r from-blue-500/5 via-indigo-500/5 to-cyan-500/5 blur-3xl pointer-events-none rounded-full" />
        
        {/* Pill Tag */}
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full border border-blue-200 bg-blue-50 text-blue-700 text-xs font-mono font-medium shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>College Hackathon • Problem Statement PS04</span>
        </div>

        {/* Title */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 max-w-4xl mx-auto leading-tight">
          See Beyond the Image. <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600">
            Discover the Truth.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-slate-600 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
          TruthLens is an AI-powered multimodal digital forensics and deepfake detection platform. 
          It combines mathematical pixel diagnostics, EXIF provenance tracing, and Google Gemini AI 
          to generate traceable, evidence-backed forensic scorecards.
        </p>

        {/* Call to Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <button
            onClick={onStart}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm flex items-center justify-center space-x-2 shadow-md shadow-blue-500/20 transition group cursor-pointer"
          >
            <span>Start Forensic Investigation</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
          </button>

          {onOpenDashboard && (
            <button
              onClick={onOpenDashboard}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 font-semibold text-sm flex items-center justify-center space-x-2 shadow-xs transition cursor-pointer"
            >
              <PanelLeftOpen className="w-4 h-4 text-blue-600" />
              <span>Open Case Dashboard</span>
            </button>
          )}
        </div>

        {/* Quick Highlights Row */}
        <div className="pt-10 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto text-left font-mono text-xs">
          <div className="glass-panel p-3.5 rounded-xl border border-slate-200 flex items-center space-x-2.5 shadow-xs">
            <Layers className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <span className="text-slate-700 font-sans font-medium">Multi-Layer Checks</span>
          </div>
          <div className="glass-panel p-3.5 rounded-xl border border-slate-200 flex items-center space-x-2.5 shadow-xs">
            <FileCheck className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <span className="text-slate-700 font-sans font-medium">Evidence Scorecard</span>
          </div>
          <div className="glass-panel p-3.5 rounded-xl border border-slate-200 flex items-center space-x-2.5 shadow-xs">
            <MessageSquare className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <span className="text-slate-700 font-sans font-medium">Caption Cross-Check</span>
          </div>
          <div className="glass-panel p-3.5 rounded-xl border border-slate-200 flex items-center space-x-2.5 shadow-xs">
            <Lock className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <span className="text-slate-700 font-sans font-medium">SHA-256 Provenance</span>
          </div>
        </div>
      </section>

      {/* 4 Multi-Layer Pillars Section */}
      <section className="space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Beyond Binary "Fake or Real" Detectors
          </h2>
          <p className="text-sm text-slate-600 max-w-xl mx-auto">
            Traditional AI detectors give opaque percentages. TruthLens provides rigorous multi-layer evidence with explicit scientific limitations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Layer 1 */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition space-y-3 relative overflow-hidden group shadow-xs">
            <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 group-hover:scale-105 transition">
              <Binary className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-mono text-blue-600 font-bold uppercase tracking-wider block">Layer 1</span>
            <h3 className="text-lg font-bold text-slate-900">Metadata & Header Diagnostics</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Extracts camera make, model, timestamps, software signatures (Photoshop, Stable Diffusion, ComfyUI), and SHA-256 hash.
            </p>
          </div>

          {/* Layer 2 */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition space-y-3 relative overflow-hidden group shadow-xs">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 group-hover:scale-105 transition">
              <Cpu className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-mono text-indigo-600 font-bold uppercase tracking-wider block">Layer 2</span>
            <h3 className="text-lg font-bold text-slate-900">Technical & Noise Forensics</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Error Level Analysis (ELA 90%), high-frequency spatial noise residual variance, Laplacian edge blur, and color balance.
            </p>
          </div>

          {/* Layer 3 */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition space-y-3 relative overflow-hidden group shadow-xs">
            <div className="w-12 h-12 rounded-xl bg-violet-50 border border-violet-200 flex items-center justify-center text-violet-600 group-hover:scale-105 transition">
              <Sparkles className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-mono text-violet-600 font-bold uppercase tracking-wider block">Layer 3</span>
            <h3 className="text-lg font-bold text-slate-900">Gemini Multimodal Reasoning</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Interrogates physical lighting coherence, specular reflections, and anatomical structural consistency using Google Gemini.
            </p>
          </div>

          {/* Layer 4 */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition space-y-3 relative overflow-hidden group shadow-xs">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 group-hover:scale-105 transition">
              <MessageSquare className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-mono text-emerald-600 font-bold uppercase tracking-wider block">Layer 4</span>
            <h3 className="text-lg font-bold text-slate-900">Image & Claim Cross-Verification</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Cross-checks accompanying claims and headlines against visual reality to identify out-of-context repurposed imagery.
            </p>
          </div>

        </div>
      </section>

      {/* The Evidence Scorecard Highlight Feature */}
      <section className="glass-panel p-8 sm:p-12 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-mono font-semibold">
              <FileCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Core Hackathon USP</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              The Evidence Scorecard: Transparent & Explainable
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Instead of an arbitrary confidence number, TruthLens breaks down each finding with its exact technical source, 
              confidence level, scientific limitations, and a dedicated <strong>"Why was this flagged?"</strong> rationale.
            </p>
            <ul className="space-y-2 text-xs text-slate-700 font-medium pt-2">
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Zero fabricated verdicts — measured observations only</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Separation of AI visual reasoning from deterministic binary checks</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>One-click downloadable court-ready PDF forensic report</span>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-5 bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-3 font-mono text-xs shadow-xs">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <span className="text-blue-600 font-bold">CASE EVALUATION PREVIEW</span>
              <span className="text-emerald-700 text-[10px] px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 font-bold">CALIBRATED</span>
            </div>
            <div className="space-y-1">
              <span className="text-slate-500 text-[10px]">INDICATOR RISK SCORE</span>
              <div className="text-2xl font-bold text-slate-900">28 <span className="text-slate-400 text-sm font-normal">/100</span></div>
            </div>
            <p className="text-slate-700 text-[11px] leading-relaxed font-sans">
              "Some indicators require further investigation: Metadata lacks hardware tags (common on social media); ELA shows minor localized variance."
            </p>
            <div className="pt-2 text-[10px] text-slate-500 italic font-sans border-t border-slate-200">
              * Absences of indicators do not equate to proof of authenticity.
            </div>
          </div>

        </div>
      </section>

      {/* Technology Stack Grid */}
      <section className="space-y-6">
        <h3 className="text-xl font-bold text-slate-900 text-center">Built With Modern Full-Stack Technologies</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 text-center font-mono text-xs">
          <div className="glass-panel p-3 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-blue-600 font-bold block">React + Vite</span>
            <span className="text-[10px] text-slate-500">TypeScript UI</span>
          </div>
          <div className="glass-panel p-3 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-blue-600 font-bold block">Python FastAPI</span>
            <span className="text-[10px] text-slate-500">Async Backend</span>
          </div>
          <div className="glass-panel p-3 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-blue-600 font-bold block">Google Gemini</span>
            <span className="text-[10px] text-slate-500">Multimodal AI</span>
          </div>
          <div className="glass-panel p-3 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-blue-600 font-bold block">OpenCV + PIL</span>
            <span className="text-[10px] text-slate-500">Image Forensics</span>
          </div>
          <div className="glass-panel p-3 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-blue-600 font-bold block">Supabase</span>
            <span className="text-[10px] text-slate-500">PostgreSQL + Auth</span>
          </div>
          <div className="glass-panel p-3 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-blue-600 font-bold block">ReportLab</span>
            <span className="text-[10px] text-slate-500">Forensic PDF Reports</span>
          </div>
        </div>
      </section>

    </div>
  );
};
