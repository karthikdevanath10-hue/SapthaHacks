import React from 'react';
import { 
  ShieldCheck, Eye, Layers, Sparkles, Binary, MessageSquare, 
  ArrowRight, FileCheck, CheckCircle2, Lock, Cpu, Database, Activity 
} from 'lucide-react';

interface LandingPageProps {
  onStart: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
  return (
    <div className="space-y-20 pb-20 max-w-7xl mx-auto font-sans">
      
      {/* Hero Section */}
      <section className="relative pt-8 lg:pt-16 text-center space-y-6">
        <div className="absolute inset-0 max-w-3xl mx-auto h-72 bg-gradient-to-r from-blue-600/10 via-cyan-500/10 to-indigo-500/10 blur-3xl pointer-events-none rounded-full" />
        
        {/* Pill Tag */}
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-950/60 text-cyan-300 text-xs font-mono font-medium shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>CYBERSECURITY DIGITAL FORENSICS // PROBLEM STATEMENT PS04</span>
        </div>

        {/* Title */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight">
          See Beyond the Pixels. <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-sky-400">
            Discover the Truth.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
          TruthLens is an enterprise-grade multimodal digital forensics platform. 
          By unifying mathematical signal extraction, sensor noise profiling, and Google Gemini AI, 
          it replaces opaque *"fake-or-real"* percentages with explainable, court-ready **Evidence Scorecards**.
        </p>

        {/* Call to Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <button
            onClick={onStart}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm flex items-center justify-center space-x-2 shadow-lg shadow-blue-600/30 transition-all group cursor-pointer"
          >
            <span>Open Investigation Intake</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
          </button>
        </div>

        {/* Telemetry Highlights */}
        <div className="pt-10 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto text-left font-mono text-xs">
          <div className="bg-[#101B2D] p-3.5 rounded-xl border border-white/10 flex items-center space-x-2.5">
            <Layers className="w-4 h-4 text-cyan-400 flex-shrink-0" />
            <span className="text-slate-300">5-Pillar Diagnostics</span>
          </div>
          <div className="bg-[#101B2D] p-3.5 rounded-xl border border-white/10 flex items-center space-x-2.5">
            <FileCheck className="w-4 h-4 text-cyan-400 flex-shrink-0" />
            <span className="text-slate-300">Evidence Scorecard</span>
          </div>
          <div className="bg-[#101B2D] p-3.5 rounded-xl border border-white/10 flex items-center space-x-2.5">
            <MessageSquare className="w-4 h-4 text-cyan-400 flex-shrink-0" />
            <span className="text-slate-300">Ground Truth Audit</span>
          </div>
          <div className="bg-[#101B2D] p-3.5 rounded-xl border border-white/10 flex items-center space-x-2.5">
            <Lock className="w-4 h-4 text-cyan-400 flex-shrink-0" />
            <span className="text-slate-300">SHA-256 Custody</span>
          </div>
        </div>
      </section>

      {/* 5-Pillar Architecture Grid */}
      <section className="space-y-8">
        <div className="text-center space-y-2">
          <div className="text-xs font-mono text-cyan-400 uppercase tracking-widest">
            SCIENTIFIC MULTI-VECTOR METHODOLOGY
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            Beyond Opaque "Real or Fake" Probabilities
          </h2>
          <p className="text-sm text-slate-400 max-w-xl mx-auto">
            TruthLens breaks down evidence across 5 independent pillars, providing exact technical sources and explicit scientific limitations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Pillar 1 */}
          <div className="bg-[#101B2D] p-6 rounded-2xl border border-white/10 hover:border-blue-500/40 transition-all space-y-3">
            <div className="w-12 h-12 rounded-xl bg-cyan-950/80 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Binary className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider block">Pillar 01</span>
            <h3 className="text-base font-bold text-white">Metadata & Provenance</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Extracts camera make, model, timestamps, software signatures (Photoshop, ComfyUI, ElevenLabs), and SHA-256 integrity hash.
            </p>
          </div>

          {/* Pillar 2 */}
          <div className="bg-[#101B2D] p-6 rounded-2xl border border-white/10 hover:border-blue-500/40 transition-all space-y-3">
            <div className="w-12 h-12 rounded-xl bg-blue-950/80 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Cpu className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-mono text-blue-400 uppercase tracking-wider block">Pillar 02</span>
            <h3 className="text-base font-bold text-white">Frequency & Noise Forensics</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Error Level Analysis (ELA 90%), high-frequency spatial noise residual variance, and temporal frame motion differentials.
            </p>
          </div>

          {/* Pillar 3 */}
          <div className="bg-[#101B2D] p-6 rounded-2xl border border-white/10 hover:border-blue-500/40 transition-all space-y-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-950/80 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Sparkles className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-wider block">Pillar 03</span>
            <h3 className="text-base font-bold text-white">Biometric & Optical Physics</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Gemini Multimodal reasoning examines specular reflections, shadow incidence angles, anatomical consistency, and facial blending.
            </p>
          </div>

          {/* Pillar 4 */}
          <div className="bg-[#101B2D] p-6 rounded-2xl border border-white/10 hover:border-blue-500/40 transition-all space-y-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-950/80 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <MessageSquare className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider block">Pillar 04</span>
            <h3 className="text-base font-bold text-white">Ground Truth Audit</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Cross-checks accompanying claims and headlines against visual reality to identify out-of-context misattribution.
            </p>
          </div>

        </div>
      </section>

      {/* Flagship Feature Banner */}
      <section className="bg-[#101B2D] p-8 sm:p-12 rounded-3xl border border-white/10 relative overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-950 border border-blue-500/40 text-cyan-300 text-xs font-mono font-semibold">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              <span>Flagship Unique Selling Proposition</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              The Evidence Scorecard: Transparent & Traceable
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Instead of a black-box probability, TruthLens breaks down each finding with its exact technical source, 
              confidence level, scientific limitations, and a dedicated <strong>"Why was this flagged?"</strong> plain-English brief.
            </p>
            <ul className="space-y-2 text-xs text-slate-300 font-medium pt-2">
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                <span>Zero fabricated verdicts — measured observations only</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                <span>Separation of AI visual reasoning from deterministic binary checks</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                <span>One-click downloadable court-ready PDF forensic report</span>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-5 bg-[#080F1F] p-6 rounded-2xl border border-white/10 space-y-3 font-mono text-xs shadow-2xl">
            <div className="flex justify-between items-center pb-2 border-b border-white/10">
              <span className="text-cyan-400 font-bold">CASE EVALUATION DOSSIER</span>
              <span className="text-emerald-400 text-[10px] px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/40 font-bold">CALIBRATED</span>
            </div>
            <div className="space-y-1">
              <span className="text-slate-400 text-[10px]">ANOMALY INDEX</span>
              <div className="text-2xl font-bold text-white">28 <span className="text-slate-500 text-sm font-normal">/100</span></div>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed font-sans">
              "Some indicators require further investigation: Metadata lacks camera tags (common on social media); ELA shows localized compression variance."
            </p>
            <div className="pt-2 text-[10px] text-slate-400 italic font-sans border-t border-white/10">
              * Absence of indicators does not equate to proof of authenticity.
            </div>
          </div>

        </div>
      </section>

    </div>
  );
};
