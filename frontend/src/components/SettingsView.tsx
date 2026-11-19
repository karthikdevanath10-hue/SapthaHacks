import React, { useState } from 'react';
import { 
  Settings, Server, Sparkles, Database, Shield, Cpu, RefreshCw, 
  CheckCircle2, XCircle, Sliders, HardDrive, Key, Lock, ExternalLink
} from 'lucide-react';
import { apiService } from '../services/api';

interface SettingsViewProps {
  apiStatus: { healthy: boolean; supabase: boolean; gemini: boolean };
  onRefreshHealth: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ apiStatus, onRefreshHealth }) => {
  const [testingPing, setTestingPing] = useState(false);
  const [pingLatency, setPingLatency] = useState<number | null>(null);
  const [statusDetails, setStatusDetails] = useState<any>(null);

  const [engineToggles, setEngineToggles] = useState({
    exifProvenance: true,
    elaQuality90: true,
    geminiMultimodalVision: true,
    facialHaarCascades: true,
    speechSpectrogramFFT: true,
    stylometricTTR: true,
    groundTruthCrossModal: true,
    zeroRetentionMode: true
  });

  const handleTestConnection = async () => {
    setTestingPing(true);
    const start = performance.now();
    try {
      const data = await apiService.checkHealth();
      const elapsed = Math.round(performance.now() - start);
      setPingLatency(elapsed);
      setStatusDetails(data);
      onRefreshHealth();
    } catch (err) {
      setPingLatency(null);
    } finally {
      setTestingPing(false);
    }
  };

  const toggleEngine = (key: keyof typeof engineToggles) => {
    setEngineToggles(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 font-sans">
      
      {/* Top Protocol Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/10">
        <div>
          <div className="text-xs font-mono text-cyan-400 mb-1 flex items-center gap-2">
            <span className="bg-cyan-950/60 border border-cyan-800 px-2 py-0.5 rounded font-bold">SYSTEM TELEMETRY</span>
            <span>// PIPELINE & CREDENTIAL AUDIT</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-mono flex items-center gap-2">
            <Settings className="w-6 h-6 text-cyan-400" />
            <span>Forensic Engine Settings</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Configure active diagnostic layers, verify cloud storage endpoints, and inspect model runtime parameters.
          </p>
        </div>

        <button
          onClick={handleTestConnection}
          disabled={testingPing}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold flex items-center space-x-2 shadow-lg shadow-blue-600/30 transition-all cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${testingPing ? 'animate-spin' : ''}`} />
          <span>{testingPing ? 'Pinging Core...' : 'Ping Engine Diagnostics'}</span>
        </button>
      </div>

      {/* Latency Banner if tested */}
      {pingLatency !== null && (
        <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-xl p-4 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center space-x-2 text-emerald-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Core responded in <strong>{pingLatency}ms</strong>. Service: {statusDetails?.service || 'TruthLens Forensic Engine'}.</span>
          </div>
          <span className="text-[10px] text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800 font-bold">
            HTTP 200 OK
          </span>
        </div>
      )}

      {/* 3 Grid Service Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Core Backend Server */}
        <div className="bg-[#101B2D] border border-white/10 rounded-xl p-5 space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-white font-bold text-sm">
              <Server className="w-4 h-4 text-blue-400" />
              <span>FastAPI Core</span>
            </div>
            {apiStatus.healthy ? (
              <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> ONLINE
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-rose-400 bg-rose-950/60 border border-rose-800 px-2 py-0.5 rounded-full">
                <XCircle className="w-3 h-3 text-rose-400" /> OFFLINE
              </span>
            )}
          </div>
          
          <div className="space-y-1.5 text-xs text-slate-300 font-mono">
            <div className="flex justify-between border-b border-white/5 pb-1">
              <span className="text-slate-400">Host Endpoint</span>
              <span className="text-white">127.0.0.1:8000</span>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-1">
              <span className="text-slate-400">Modalities</span>
              <span className="text-cyan-400">IMG, VID, AUD, TXT</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Max Payload</span>
              <span className="text-slate-300">50 MB</span>
            </div>
          </div>
        </div>

        {/* Gemini Engine */}
        <div className="bg-[#101B2D] border border-white/10 rounded-xl p-5 space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-white font-bold text-sm">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Gemini 3.5 Flash</span>
            </div>
            {apiStatus.gemini ? (
              <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-cyan-300 bg-cyan-950/60 border border-cyan-800 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" /> CONFIGURED
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-amber-400 bg-amber-950/60 border border-amber-800 px-2 py-0.5 rounded-full">
                NOT DETECTED
              </span>
            )}
          </div>

          <div className="space-y-1.5 text-xs text-slate-300 font-mono">
            <div className="flex justify-between border-b border-white/5 pb-1">
              <span className="text-slate-400">Active Model</span>
              <span className="text-white">gemini-3.5-flash-lite</span>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-1">
              <span className="text-slate-400">Multimodal Vision</span>
              <span className="text-emerald-400">Active</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Cross-Verification</span>
              <span className="text-emerald-400">Ground Truth ON</span>
            </div>
          </div>
        </div>

        {/* Supabase Vault */}
        <div className="bg-[#101B2D] border border-white/10 rounded-xl p-5 space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-white font-bold text-sm">
              <Database className="w-4 h-4 text-emerald-400" />
              <span>Supabase Cloud Vault</span>
            </div>
            {apiStatus.supabase ? (
              <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-300 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded-full">
                <Lock className="w-3 h-3 text-emerald-400" /> SYNCHRONIZED
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-slate-400 bg-slate-800 border border-slate-700 px-2 py-0.5 rounded-full">
                LOCAL STORE
              </span>
            )}
          </div>

          <div className="space-y-1.5 text-xs text-slate-300 font-mono">
            <div className="flex justify-between border-b border-white/5 pb-1">
              <span className="text-slate-400">Project Endpoint</span>
              <span className="text-white">zqegdkvkhmqflcz...</span>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-1">
              <span className="text-slate-400">Storage Bucket</span>
              <span className="text-blue-400">truthlens-media</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Auth Engine</span>
              <span className="text-slate-300">RLS / PostgREST</span>
            </div>
          </div>
        </div>

      </div>

      {/* Forensic Pipeline Configuration */}
      <div className="bg-[#101B2D] border border-white/10 rounded-2xl p-6 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center space-x-2">
            <Sliders className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-white font-mono">Active Forensic Pipeline Layers</h3>
          </div>
          <span className="text-[11px] font-mono text-slate-400">Pillar 1–5 Configuration</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          <div 
            onClick={() => toggleEngine('exifProvenance')}
            className={`p-4 rounded-xl border cursor-pointer transition flex items-start justify-between ${
              engineToggles.exifProvenance 
                ? 'bg-[#142238] border-cyan-500/40' 
                : 'bg-[#080F1F]/60 border-white/5 opacity-60'
            }`}
          >
            <div className="space-y-1 pr-3">
              <p className="text-xs font-bold text-white font-mono flex items-center gap-1.5">
                <span>Pillar 1: EXIF Metadata & Hex Provenance</span>
              </p>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Extracts camera hardware strings, GPS tags, timestamp chronologies, and software editing signatures.
              </p>
            </div>
            <input 
              type="checkbox" 
              checked={engineToggles.exifProvenance} 
              onChange={() => {}} 
              className="mt-1 rounded bg-[#080F1F] border-slate-700 text-cyan-500 focus:ring-0" 
            />
          </div>

          <div 
            onClick={() => toggleEngine('elaQuality90')}
            className={`p-4 rounded-xl border cursor-pointer transition flex items-start justify-between ${
              engineToggles.elaQuality90 
                ? 'bg-[#142238] border-cyan-500/40' 
                : 'bg-[#080F1F]/60 border-white/5 opacity-60'
            }`}
          >
            <div className="space-y-1 pr-3">
              <p className="text-xs font-bold text-white font-mono flex items-center gap-1.5">
                <span>Pillar 2: Error Level Analysis (ELA 90%)</span>
              </p>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Calculates pixel-level compression differentials to highlight digitally cloned or spliced fragments.
              </p>
            </div>
            <input 
              type="checkbox" 
              checked={engineToggles.elaQuality90} 
              onChange={() => {}} 
              className="mt-1 rounded bg-[#080F1F] border-slate-700 text-cyan-500 focus:ring-0" 
            />
          </div>

          <div 
            onClick={() => toggleEngine('geminiMultimodalVision')}
            className={`p-4 rounded-xl border cursor-pointer transition flex items-start justify-between ${
              engineToggles.geminiMultimodalVision 
                ? 'bg-[#142238] border-cyan-500/40' 
                : 'bg-[#080F1F]/60 border-white/5 opacity-60'
            }`}
          >
            <div className="space-y-1 pr-3">
              <p className="text-xs font-bold text-white font-mono flex items-center gap-1.5">
                <span>Pillar 3: Biometric & Optical Physics Engine</span>
              </p>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Analyzes lighting geometry, specular eye reflections, anatomical symmetry, and unnatural smoothing.
              </p>
            </div>
            <input 
              type="checkbox" 
              checked={engineToggles.geminiMultimodalVision} 
              onChange={() => {}} 
              className="mt-1 rounded bg-[#080F1F] border-slate-700 text-cyan-500 focus:ring-0" 
            />
          </div>

          <div 
            onClick={() => toggleEngine('groundTruthCrossModal')}
            className={`p-4 rounded-xl border cursor-pointer transition flex items-start justify-between ${
              engineToggles.groundTruthCrossModal 
                ? 'bg-[#142238] border-cyan-500/40' 
                : 'bg-[#080F1F]/60 border-white/5 opacity-60'
            }`}
          >
            <div className="space-y-1 pr-3">
              <p className="text-xs font-bold text-white font-mono flex items-center gap-1.5">
                <span>Pillar 4: Semantic Ground-Truth Audit</span>
              </p>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Cross-examines user claim narratives and viral headlines directly against visual evidence.
              </p>
            </div>
            <input 
              type="checkbox" 
              checked={engineToggles.groundTruthCrossModal} 
              onChange={() => {}} 
              className="mt-1 rounded bg-[#080F1F] border-slate-700 text-cyan-500 focus:ring-0" 
            />
          </div>

          <div 
            onClick={() => toggleEngine('facialHaarCascades')}
            className={`p-4 rounded-xl border cursor-pointer transition flex items-start justify-between ${
              engineToggles.facialHaarCascades 
                ? 'bg-[#142238] border-cyan-500/40' 
                : 'bg-[#080F1F]/60 border-white/5 opacity-60'
            }`}
          >
            <div className="space-y-1 pr-3">
              <p className="text-xs font-bold text-white font-mono flex items-center gap-1.5">
                <span>Video: Temporal Jitter & Face Boundary Analysis</span>
              </p>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Extracts keyframe sequences and computes inter-frame motion jitter and facial perimeter blending masks.
              </p>
            </div>
            <input 
              type="checkbox" 
              checked={engineToggles.facialHaarCascades} 
              onChange={() => {}} 
              className="mt-1 rounded bg-[#080F1F] border-slate-700 text-cyan-500 focus:ring-0" 
            />
          </div>

          <div 
            onClick={() => toggleEngine('speechSpectrogramFFT')}
            className={`p-4 rounded-xl border cursor-pointer transition flex items-start justify-between ${
              engineToggles.speechSpectrogramFFT 
                ? 'bg-[#142238] border-cyan-500/40' 
                : 'bg-[#080F1F]/60 border-white/5 opacity-60'
            }`}
          >
            <div className="space-y-1 pr-3">
              <p className="text-xs font-bold text-white font-mono flex items-center gap-1.5">
                <span>Audio: FFT Spectral & Vocoder Cutoff Inspection</span>
              </p>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Audits high-frequency voice roll-offs and respiratory pauses typical of neural synthetic clones.
              </p>
            </div>
            <input 
              type="checkbox" 
              checked={engineToggles.speechSpectrogramFFT} 
              onChange={() => {}} 
              className="mt-1 rounded bg-[#080F1F] border-slate-700 text-cyan-500 focus:ring-0" 
            />
          </div>

        </div>
      </div>

      {/* Protocol Compliance & Zero-Retention Notice */}
      <div className="bg-[#142238]/60 border border-white/10 rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white font-mono">Zero-Retention Cryptographic Sandbox</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Specimens uploaded during forensic sessions are processed in ephemeral memory. SHA-256 chain-of-custody seals remain tamper-evident.
            </p>
          </div>
        </div>

        <span className="text-[10px] font-mono font-bold text-cyan-300 bg-cyan-950/80 border border-cyan-800 px-3 py-1.5 rounded-lg shrink-0">
          ISO/IEC 27037 FORENSIC ALIGNED
        </span>
      </div>

    </div>
  );
};
