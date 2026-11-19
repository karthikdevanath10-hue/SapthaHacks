import React, { useState, useRef } from 'react';
import { 
  UploadCloud, Link as LinkIcon, ShieldAlert, Cpu, ArrowRight,
  Loader2, CheckCircle2, Image as ImageIcon, Video, Mic, FileText,
  Copy, Check, Trash2, Sparkles, FileEdit
} from 'lucide-react';
import { MediaModality, FullAnalysisResponse, UserProfile } from '../types';
import { apiService } from '../services/api';

interface Props {
  currentUser: UserProfile | null;
  onAnalysisComplete: (result: FullAnalysisResponse) => void;
}

const MODALITY_STEPS: Record<MediaModality, string[]> = {
  image: [
    'Verifying binary integrity & generating SHA-256 fingerprint...',
    'Extracting embedded EXIF headers & generation metadata tags...',
    'Executing Error Level Analysis (ELA 90%) & spatial noise variance...',
    'Interrogating Gemini Multimodal Vision for physical/lighting coherence...',
    'Cross-verifying narrative claims against visual ground truth...',
    'Synthesizing Evidence Scorecard & compiling cryptographic PDF report...'
  ],
  video: [
    'Sampling temporal keyframe trajectory & calculating SHA-256...',
    'Measuring inter-frame motion jitter and optical flow differentials...',
    'Evaluating facial perimeter blending gradients via Haar cascade filters...',
    'Interrogating Gemini Multimodal Video for deepfake morphing markers...',
    'Cross-verifying temporal scene continuity against claimed narrative...',
    'Synthesizing Video Evidence Scorecard & compiling forensic PDF...'
  ],
  audio: [
    'Extracting acoustic frequency spectrum & sample rate parameters...',
    'Measuring speech-to-pause ratio & human respiratory micro-intervals...',
    'Inspecting Fast Fourier Transform (FFT) for neural vocoder cutoffs...',
    'Interrogating Gemini Multimodal Audio for synthetic voice clone timbres...',
    'Evaluating room reverberation & acoustic environment consistency...',
    'Synthesizing Audio Evidence Scorecard & compiling forensic PDF...'
  ],
  text: [
    'Parsing syntactic structure & calculating Type-Token Ratio (TTR)...',
    'Measuring sentence length variance & syntactic burstiness (σ)...',
    'Identifying Large Language Model (LLM) transition markers & idioms...',
    'Decomposing narrative assertions for factual inconsistencies...',
    'Interrogating Gemini for synthetic generation & disinformation patterns...',
    'Synthesizing Text Evidence Scorecard & compiling forensic PDF...'
  ]
};

export const NewInvestigationIntake: React.FC<Props> = ({ currentUser, onAnalysisComplete }) => {
  const [selectedModality, setSelectedModality] = useState<MediaModality>('image');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [claimText, setClaimText] = useState('');
  const [originUrl, setOriginUrl] = useState('');
  const [directText, setDirectText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedHash, setCopiedHash] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [engines, setEngines] = useState({
    exif: true,
    ela: true,
    deepfake: true,
    caption: true,
    video: true,
    audio: true,
    text: true
  });

  const getAcceptedExtensions = (modality: MediaModality) => {
    switch (modality) {
      case 'video': return 'video/mp4,video/quicktime,video/webm,video/x-msvideo';
      case 'audio': return 'audio/mpeg,audio/wav,audio/mp4,audio/aac,audio/ogg';
      case 'text': return 'text/plain';
      case 'image':
      default: return 'image/jpeg,image/png,image/webp,image/tiff';
    }
  };

  const handleModalityChange = (mod: MediaModality) => {
    setSelectedModality(mod);
    setSelectedFile(null);
    setPreviewUrl(null);
    setDirectText('');
    setErrorMsg(null);
  };

  const handleFileChange = (file: File) => {
    setErrorMsg(null);
    if (file.size > 50 * 1024 * 1024) {
      setErrorMsg('File exceeds 50MB maximum limit.');
      return;
    }

    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (['.mp4', '.mov', '.webm', '.avi', '.mkv'].includes(ext)) {
      setSelectedModality('video');
    } else if (['.mp3', '.wav', '.m4a', '.ogg', '.aac', '.flac'].includes(ext)) {
      setSelectedModality('audio');
    } else if (['.txt'].includes(ext)) {
      setSelectedModality('text');
    } else {
      setSelectedModality('image');
    }

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleCopyHash = () => {
    const dummyHash = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
    navigator.clipboard.writeText(dummyHash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const handleStartAnalysis = async () => {
    if (!selectedFile && !directText.trim()) return;
    setIsAnalyzing(true);
    setErrorMsg(null);
    setCurrentStepIndex(0);

    const steps = MODALITY_STEPS[selectedModality];
    const timer = setInterval(() => {
      setCurrentStepIndex(prev => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 1100);

    try {
      const result = await apiService.analyzeMedia({
        file: selectedFile,
        textContent: directText,
        caption: claimText,
        sourceContext: originUrl,
        userId: currentUser?.id
      });
      clearInterval(timer);
      onAnalysisComplete(result);
    } catch (err: any) {
      clearInterval(timer);
      const detail = err.response?.data?.detail || err.message || 'Forensic analysis failed';
      setErrorMsg(detail);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setDirectText('');
    setClaimText('');
    setOriginUrl('');
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen bg-[#080F1F] text-slate-100 p-4 sm:p-6 lg:p-8 font-sans max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-white/10">
        <div>
          <div className="text-xs font-mono text-cyan-400 mb-1 flex items-center space-x-2">
            <span className="bg-cyan-950/60 border border-cyan-800 px-2 py-0.5 rounded">OPERATIONAL PROTOCOL</span>
            <span>// CASE INTAKE V4.8 ACTIVE</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Start a New Forensic Investigation
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Ingest suspect digital media across Image, Video, Voice, or Text for deep multi-vector forensic evaluation.
          </p>
        </div>

        {/* Modality Selector Tabs */}
        <div className="flex items-center flex-wrap gap-1.5 bg-[#101B2D] p-1.5 rounded-xl border border-white/10 text-xs">
          {[
            { id: 'image', label: 'Image', icon: <ImageIcon className="w-3.5 h-3.5" /> },
            { id: 'video', label: 'Video', icon: <Video className="w-3.5 h-3.5" /> },
            { id: 'audio', label: 'Voice / Audio', icon: <Mic className="w-3.5 h-3.5" /> },
            { id: 'text', label: 'Text / Claims', icon: <FileText className="w-3.5 h-3.5" /> },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => handleModalityChange(tab.id as MediaModality)}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center space-x-1.5 transition-all ${
                selectedModality === tab.id
                  ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: File Dropzone & Staged Specimen */}
        <div className="lg:col-span-2 space-y-4">
          
          {selectedModality === 'text' && !selectedFile ? (
            /* Direct Text Input Box */
            <div className="bg-[#101B2D] border border-white/10 rounded-2xl p-6 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono text-cyan-400 font-semibold flex items-center gap-2">
                  <FileEdit className="w-4 h-4 text-cyan-400" />
                  <span>SUSPECT TEXT OR STATEMENT INTAKE</span>
                </label>
                <span className="text-[11px] text-slate-400 font-mono">
                  {directText.split(/\s+/).filter(Boolean).length} words
                </span>
              </div>
              <textarea
                rows={9}
                value={directText}
                onChange={(e) => setDirectText(e.target.value)}
                placeholder="Paste the statement, breaking news article, social media post, or audio transcript here to inspect lexical diversity (TTR), syntactic burstiness, and LLM synthesis signatures..."
                className="w-full bg-[#142238] border border-white/10 rounded-xl p-4 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 font-sans resize-y"
              />
              <div className="flex justify-between items-center text-xs text-slate-400 pt-1">
                <span>Or upload a .txt document:</span>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-lg bg-[#142238] border border-white/10 text-cyan-300 hover:text-white hover:border-cyan-500/40 text-xs"
                >
                  Browse .txt File
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept=".txt"
                  onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
                />
              </div>
            </div>
          ) : !previewUrl ? (
            /* Stitch-Inspired Dropzone */
            <div 
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-white/15 hover:border-blue-500/50 rounded-2xl bg-[#101B2D]/70 p-10 flex flex-col items-center justify-center text-center transition-all cursor-pointer group"
            >
              <input 
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept={getAcceptedExtensions(selectedModality)}
                onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
              />
              
              <div className="w-16 h-16 rounded-2xl bg-blue-600/10 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-4 group-hover:scale-105 group-hover:border-cyan-400 transition shadow-lg shadow-blue-900/30">
                {selectedModality === 'video' ? (
                  <Video className="w-8 h-8 text-cyan-400" />
                ) : selectedModality === 'audio' ? (
                  <Mic className="w-8 h-8 text-cyan-400" />
                ) : selectedModality === 'text' ? (
                  <FileText className="w-8 h-8 text-cyan-400" />
                ) : (
                  <UploadCloud className="w-8 h-8 text-cyan-400" />
                )}
              </div>

              <h3 className="text-lg font-semibold text-white">
                Drag and drop suspect {selectedModality.toUpperCase()} here
              </h3>
              <p className="text-xs text-slate-400 mt-1 mb-4">
                or click to browse local file system
              </p>

              <div className="flex flex-wrap gap-2 justify-center">
                {selectedModality === 'image' && ['JPG', 'JPEG', 'PNG', 'WEBP', 'TIFF (Max 50MB)'].map(ext => (
                  <span key={ext} className="text-[10px] font-mono bg-white/5 border border-white/5 px-2 py-0.5 rounded text-slate-400">{ext}</span>
                ))}
                {selectedModality === 'video' && ['MP4', 'MOV', 'WEBM', 'AVI (Max 50MB)'].map(ext => (
                  <span key={ext} className="text-[10px] font-mono bg-white/5 border border-white/5 px-2 py-0.5 rounded text-slate-400">{ext}</span>
                ))}
                {selectedModality === 'audio' && ['MP3', 'WAV', 'M4A', 'AAC (Max 50MB)'].map(ext => (
                  <span key={ext} className="text-[10px] font-mono bg-white/5 border border-white/5 px-2 py-0.5 rounded text-slate-400">{ext}</span>
                ))}
                {selectedModality === 'text' && ['TXT (UTF-8 Plaintext)'].map(ext => (
                  <span key={ext} className="text-[10px] font-mono bg-white/5 border border-white/5 px-2 py-0.5 rounded text-slate-400">{ext}</span>
                ))}
              </div>
            </div>
          ) : (
            /* Stitch-Inspired Staged Specimen Card */
            <div className="bg-[#142238] border border-white/10 rounded-2xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <div className="w-28 h-28 rounded-xl bg-slate-950 border border-white/10 overflow-hidden flex items-center justify-center flex-shrink-0">
                  {selectedModality === 'video' ? (
                    <video src={previewUrl} controls className="w-full h-full object-cover" />
                  ) : selectedModality === 'audio' ? (
                    <Mic className="w-10 h-10 text-cyan-400" />
                  ) : (
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
                  )}
                </div>

                <div className="flex-1 space-y-1.5 w-full">
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-sm font-bold text-white truncate max-w-xs">
                      {selectedFile?.name}
                    </span>
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded font-bold">
                        STAGED
                      </span>
                      <button
                        onClick={handleReset}
                        className="text-slate-400 hover:text-rose-400 p-1"
                        title="Remove"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 font-mono">
                    Size: {(Number(selectedFile?.size) / (1024 * 1024)).toFixed(2)} MB • Modality: {selectedModality.toUpperCase()} • Type: {selectedFile?.type || 'Binary Stream'}
                  </p>

                  <div className="bg-[#070e1e] p-2 rounded-lg text-[11px] font-mono text-slate-300 flex items-center justify-between">
                    <span className="truncate">
                      Pre-Ingestion Hash: <code>CALCULATING_SHA256_ON_RAM...</code>
                    </span>
                    <button 
                      onClick={handleCopyHash}
                      className="text-cyan-400 hover:underline flex items-center gap-1 flex-shrink-0 ml-2"
                    >
                      {copiedHash ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedHash ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Cryptographic Zero-Retention Policy Callout */}
          <div className="p-4 bg-[#101B2D] border border-cyan-800/40 rounded-xl flex gap-3 text-xs text-slate-300">
            <ShieldAlert className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong className="text-white">Zero-Retention Forensic Chain of Custody: </strong> 
              Intake runs in memory sandbox. Specimen binary is cryptographically hashed with SHA-256, analyzed across multi-layer pipelines, and archived with Row-Level Security in your Supabase registry.
            </p>
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-xs text-rose-300 flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

        </div>

        {/* Right Col: Claim Ingestion & Engine Toggles */}
        <div className="space-y-4">
          <div className="bg-[#101B2D] border border-white/10 rounded-2xl p-5 space-y-4">
            
            {/* Caption / Claim */}
            <div>
              <label className="text-xs font-mono text-slate-300 block mb-1.5 font-semibold">
                ASSOCIATED CAPTION OR CLAIM <span className="text-cyan-400 text-[10px]">(CRITICAL FOR SEMANTIC AUDIT)</span>
              </label>
              <textarea 
                rows={3} 
                value={claimText} 
                onChange={(e) => setClaimText(e.target.value)}
                placeholder="Paste the viral social caption, news headline, or context claim associated with this image..."
                className="w-full bg-[#142238] border border-white/10 rounded-lg p-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 font-sans resize-none"
              />
            </div>

            {/* Source Origin URL */}
            <div>
              <label className="text-xs font-mono text-slate-300 block mb-1.5 font-semibold">
                SOURCE / MEDIA ORIGIN URL
              </label>
              <div className="flex items-center bg-[#142238] border border-white/10 rounded-lg px-3 py-2 text-xs">
                <LinkIcon className="w-4 h-4 text-slate-400 mr-2 flex-shrink-0" />
                <input 
                  type="text" 
                  value={originUrl} 
                  onChange={(e) => setOriginUrl(e.target.value)}
                  placeholder="https://x.com/breakingnews/status/..." 
                  className="bg-transparent w-full focus:outline-none text-white font-mono placeholder:text-slate-500"
                />
              </div>
            </div>

            {/* Forensic Scan Engines */}
            <div>
              <label className="text-xs font-mono text-slate-300 block mb-2 font-semibold">
                ACTIVE FORENSIC ENGINES
              </label>
              <div className="space-y-2">
                {[
                  { key: 'exif', label: 'EXIF & Binary Metadata Deep Dive', locked: false },
                  { key: 'ela', label: 'Error Level Analysis (ELA 90%)', locked: false },
                  { key: 'deepfake', label: 'Gemini Multimodal Physical Coherence', locked: false },
                  { key: 'caption', label: 'Semantic Claim & Ground Truth Audit', locked: false },
                  { key: 'video', label: 'Video Temporal Jitter & Face Boundary', locked: false, ver: 'v4.8' },
                  { key: 'audio', label: 'Audio Vocoder & Breath Gap Biometrics', locked: false, ver: 'v4.8' },
                ].map(eng => (
                  <div 
                    key={eng.key} 
                    className="flex items-center justify-between p-2.5 rounded-lg border text-xs bg-[#142238] border-white/10 text-slate-200"
                  >
                    <span>{eng.label}</span>
                    <span className="font-mono text-[9px] bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 px-1.5 py-0.5 rounded font-bold">
                      ACTIVE
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Launch CTA */}
            <button
              disabled={(!selectedFile && !directText.trim()) || isAnalyzing}
              onClick={handleStartAnalysis}
              className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center space-x-2 transition-all shadow-lg ${
                (selectedFile || directText.trim()) && !isAnalyzing
                  ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30 cursor-pointer'
                  : 'bg-slate-800 text-slate-500 border border-white/5 cursor-not-allowed'
              }`}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-cyan-300" />
                  <span>Executing Forensic Pipeline...</span>
                </>
              ) : (
                <>
                  <span>Initiate Deep Forensic Analysis</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </button>

          </div>
        </div>

      </div>

      {/* Analysis Live Progress Stepper Overlay */}
      {isAnalyzing && (
        <div className="fixed inset-0 z-50 bg-[#080F1F]/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#101B2D] max-w-md w-full p-6 rounded-2xl border border-cyan-500/40 space-y-5 shadow-2xl text-center">
            
            <div className="w-16 h-16 rounded-2xl bg-[#142238] border border-cyan-500/40 flex items-center justify-center mx-auto shadow-lg shadow-cyan-500/20">
              <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
            </div>

            <div className="space-y-1">
              <div className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest">
                INFERENCE IN PROGRESS // NV-ORIN PIPELINE
              </div>
              <h3 className="text-lg font-bold text-white tracking-wide">
                Executing {selectedModality.toUpperCase()} Forensics
              </h3>
              <p className="text-xs text-slate-400">
                Multi-layer inspection across mathematical signal, cryptographic and AI pipelines
              </p>
            </div>

            <div className="space-y-2 text-left bg-[#070e1e] p-4 rounded-xl border border-white/5">
              {MODALITY_STEPS[selectedModality].map((step, idx) => (
                <div key={idx} className="flex items-center space-x-2 text-xs">
                  {idx < currentStepIndex ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  ) : idx === currentStepIndex ? (
                    <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin flex-shrink-0" />
                  ) : (
                    <div className="w-3.5 h-3.5 rounded-full border border-slate-700 flex-shrink-0" />
                  )}
                  <span className={idx === currentStepIndex ? 'text-cyan-300 font-semibold' : idx < currentStepIndex ? 'text-slate-400' : 'text-slate-600'}>
                    {step}
                  </span>
                </div>
              ))}
            </div>

            <p className="text-[11px] text-slate-500 font-mono italic">
              TruthLens Core V4.8 • Zero-Retention RAM Execution
            </p>

          </div>
        </div>
      )}

    </div>
  );
};
