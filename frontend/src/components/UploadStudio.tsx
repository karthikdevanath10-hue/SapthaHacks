import React, { useState, useRef } from 'react';
import { 
  UploadCloud, Image as ImageIcon, Video, Mic, FileText, CheckCircle2, 
  AlertCircle, Loader2, ArrowRight, RefreshCw, Layers, ShieldCheck, Download, Trash2,
  Play, Volume2, Sparkles, FileEdit
} from 'lucide-react';
import { FullAnalysisResponse, UserProfile, MediaModality } from '../types';
import { apiService } from '../services/api';
import { EvidenceScorecardView } from './EvidenceScorecardView';
import { MetadataViewer } from './MetadataViewer';
import { TechnicalViewer } from './TechnicalViewer';
import { VideoViewer } from './VideoViewer';
import { AudioViewer } from './AudioViewer';
import { TextViewer } from './TextViewer';
import { AIVisionViewer } from './AIVisionViewer';
import { CaptionCrossVerifier } from './CaptionCrossVerifier';

interface UploadStudioProps {
  currentUser: UserProfile | null;
  onAnalysisComplete?: (result: FullAnalysisResponse) => void;
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

export const UploadStudio: React.FC<UploadStudioProps> = ({ currentUser, onAnalysisComplete }) => {
  const [selectedModality, setSelectedModality] = useState<MediaModality>('image');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [directText, setDirectText] = useState<string>('');
  const [caption, setCaption] = useState<string>('');
  const [sourceContext, setSourceContext] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [analysisResult, setAnalysisResult] = useState<FullAnalysisResponse | null>(null);
  const [activeTab, setActiveTab] = useState<'scorecard' | 'diagnostics' | 'metadata' | 'ai' | 'caption'>('scorecard');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const getAcceptedExtensions = (modality: MediaModality) => {
    switch (modality) {
      case 'video':
        return 'video/mp4,video/quicktime,video/webm,video/x-msvideo';
      case 'audio':
        return 'audio/mpeg,audio/wav,audio/mp4,audio/aac,audio/ogg';
      case 'text':
        return 'text/plain';
      case 'image':
      default:
        return 'image/jpeg,image/png,image/webp,image/tiff';
    }
  };

  const handleModalityChange = (mod: MediaModality) => {
    setSelectedModality(mod);
    setSelectedFile(null);
    setPreviewUrl(null);
    setDirectText('');
    setAnalysisResult(null);
    setErrorMsg(null);
  };

  const handleFileChange = (file: File) => {
    setErrorMsg(null);
    if (file.size > 50 * 1024 * 1024) {
      setErrorMsg('File exceeds 50MB maximum limit.');
      return;
    }

    // Auto-detect modality from extension
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
    setAnalysisResult(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
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
        caption,
        sourceContext,
        userId: currentUser?.id
      });
      clearInterval(timer);
      setAnalysisResult(result);
      if (onAnalysisComplete) onAnalysisComplete(result);
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
    setCaption('');
    setSourceContext('');
    setAnalysisResult(null);
    setErrorMsg(null);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      
      {!analysisResult ? (
        <div className="space-y-6">
          
          {/* Modality Selector Header */}
          <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-cyan-400" />
                <span>Multimodal Forensic Ingestion Studio</span>
              </h2>
              <p className="text-xs text-slate-400">
                Select target media modality to activate specialized forensic pipelines
              </p>
            </div>

            {/* Modality Switcher Buttons */}
            <div className="flex items-center flex-wrap gap-2 bg-cyber-950/80 p-1.5 rounded-xl border border-slate-800 text-xs">
              {[
                { id: 'image', label: 'Image Forensics', icon: <ImageIcon className="w-4 h-4" /> },
                { id: 'video', label: 'Video Deepfake', icon: <Video className="w-4 h-4" /> },
                { id: 'audio', label: 'Voice / Audio', icon: <Mic className="w-4 h-4" /> },
                { id: 'text', label: 'Text & Narrative', icon: <FileText className="w-4 h-4" /> },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => handleModalityChange(tab.id as MediaModality)}
                  className={`px-3 py-2 rounded-lg font-semibold flex items-center space-x-2 transition ${
                    selectedModality === tab.id
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: Media Uploader & Previews */}
            <div className="lg:col-span-7 space-y-4">
              
              {selectedModality === 'text' && !selectedFile ? (
                /* Direct Text Input Box */
                <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-bold text-white flex items-center space-x-2">
                      <FileEdit className="w-4 h-4 text-cyan-400" />
                      <span>Input Suspicious Statement or Article</span>
                    </label>
                    <span className="text-xs text-slate-400 font-mono">
                      {directText.split(/\s+/).filter(Boolean).length} words
                    </span>
                  </div>
                  <textarea
                    rows={8}
                    value={directText}
                    onChange={(e) => setDirectText(e.target.value)}
                    placeholder="Paste suspect text, article, social media post, or speech transcript here for stylometric, burstiness, and LLM synthesis examination..."
                    className="w-full bg-cyber-950/80 border border-slate-800 rounded-xl p-4 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 resize-y"
                  />
                  
                  <div className="pt-2 flex items-center justify-between text-xs text-slate-400">
                    <span>Or upload a .txt file:</span>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1 rounded-lg border border-slate-700 bg-cyber-900 text-slate-300 hover:text-white"
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
                /* Drag & Drop File Zone */
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-cyan-500/30 hover:border-cyan-400/70 rounded-2xl p-10 flex flex-col items-center justify-center text-center cursor-pointer glass-panel transition group relative overflow-hidden"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept={getAcceptedExtensions(selectedModality)}
                    onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
                  />
                  
                  <div className="w-16 h-16 rounded-2xl bg-cyan-950/70 border border-cyan-500/30 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:border-cyan-400 transition shadow-lg shadow-cyan-950">
                    {selectedModality === 'video' ? (
                      <Video className="w-8 h-8 text-cyan-400" />
                    ) : selectedModality === 'audio' ? (
                      <Mic className="w-8 h-8 text-cyan-400" />
                    ) : selectedModality === 'text' ? (
                      <FileText className="w-8 h-8 text-cyan-400" />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-cyan-400" />
                    )}
                  </div>
                  
                  <h3 className="text-base font-semibold text-white mb-1">
                    Drag and drop suspect {selectedModality.toUpperCase()} file here
                  </h3>
                  <p className="text-xs text-slate-400 mb-4 max-w-xs">
                    {selectedModality === 'video' && 'Supports MP4, MOV, WEBM, AVI up to 50MB.'}
                    {selectedModality === 'audio' && 'Supports MP3, WAV, M4A, AAC, OGG up to 50MB.'}
                    {selectedModality === 'text' && 'Supports TXT plain text documents.'}
                    {selectedModality === 'image' && 'Supports JPG, PNG, WEBP, TIFF up to 25MB.'}
                  </p>

                  <button 
                    type="button" 
                    className="px-4 py-2 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-semibold transition"
                  >
                    Browse Local {selectedModality.toUpperCase()}
                  </button>
                </div>
              ) : (
                /* Dynamic Media Preview Box */
                <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-3 relative">
                  <div className="relative rounded-xl overflow-hidden bg-cyber-950 flex items-center justify-center max-h-[420px] border border-slate-800 p-2">
                    {selectedModality === 'video' ? (
                      <video 
                        src={previewUrl} 
                        controls 
                        className="max-h-[380px] w-auto rounded-lg"
                      />
                    ) : selectedModality === 'audio' ? (
                      <div className="py-12 px-6 w-full text-center space-y-4">
                        <div className="w-16 h-16 rounded-full bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center mx-auto shadow-lg shadow-cyan-500/20">
                          <Volume2 className="w-8 h-8 text-cyan-400 animate-pulse" />
                        </div>
                        <audio src={previewUrl} controls className="w-full max-w-md mx-auto" />
                      </div>
                    ) : (
                      <img 
                        src={previewUrl} 
                        alt="Preview" 
                        className="max-h-[380px] w-auto object-contain"
                      />
                    )}

                    <button
                      onClick={handleReset}
                      className="absolute top-3 right-3 p-2 rounded-lg bg-cyber-950/80 border border-slate-700 text-slate-300 hover:text-rose-400 transition"
                      title="Remove Media"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400 font-mono px-1">
                    <span>Target: <strong className="text-white">{selectedFile?.name}</strong></span>
                    <span>Modality: <strong className="text-cyan-400 uppercase">{selectedModality}</strong></span>
                    <span>Size: {(Number(selectedFile?.size) / (1024 * 1024)).toFixed(2)} MB</span>
                  </div>
                </div>
              )}

              {/* Error Callout */}
              {errorMsg && (
                <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-xs text-rose-300 flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

            </div>

            {/* Right Column: Context Claims & Action Trigger */}
            <div className="lg:col-span-5 space-y-4">
              
              <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-5">
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-white flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-cyan-400" />
                    <span>Narrative Claim / Context</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Provide the caption, tweet headline, or statement associated with this media
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Reported Caption or News Claim
                  </label>
                  <textarea
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="e.g. 'Viral video showing leaked military drone footage over disputed border.'"
                    rows={3}
                    className="w-full bg-cyber-950/80 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 resize-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Source Channel or Origin
                  </label>
                  <input
                    type="text"
                    value={sourceContext}
                    onChange={(e) => setSourceContext(e.target.value)}
                    placeholder="e.g. 'Telegram channel', 'X (Twitter)', 'Deepfake forum'"
                    className="w-full bg-cyber-950/80 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50"
                  />
                </div>

                {/* Modality Specific Highlights */}
                <div className="p-3.5 rounded-xl bg-cyber-950/50 border border-slate-800 text-[11px] text-slate-400 space-y-1 font-mono">
                  <span className="font-semibold text-cyan-400 block">Active Pipeline Features:</span>
                  {selectedModality === 'video' && <span>• Motion Jitter • Face Boundary Gradient • Gemini Deepfake</span>}
                  {selectedModality === 'audio' && <span>• Acoustic Spectrum • Speech/Pause Ratio • Voice Cloning Timbre</span>}
                  {selectedModality === 'text' && <span>• Type-Token Ratio • Syntactic Burstiness • LLM Token Markers</span>}
                  {selectedModality === 'image' && <span>• EXIF Inspection • Error Level Analysis (ELA) • Gemini Vision</span>}
                </div>

                {/* Submit Button */}
                <button
                  disabled={(!selectedFile && !directText.trim()) || isAnalyzing}
                  onClick={handleStartAnalysis}
                  className={`w-full py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center space-x-2 transition shadow-lg ${
                    (selectedFile || directText.trim()) && !isAnalyzing
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-cyan-500/25 cursor-pointer'
                      : 'bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed'
                  }`}
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-cyan-300" />
                      <span>Executing {selectedModality.toUpperCase()} Forensics...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-cyan-200" />
                      <span>Commence Forensic Investigation</span>
                    </>
                  )}
                </button>

              </div>

            </div>

          </div>

        </div>
      ) : (
        /* Results Mode */
        <div className="space-y-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <button
                onClick={handleReset}
                className="px-3 py-1.5 rounded-lg border border-slate-700 bg-cyber-900 text-slate-300 hover:text-white text-xs font-semibold flex items-center space-x-1.5 transition"
              >
                <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
                <span>New Investigation</span>
              </button>
              <span className="text-xs text-slate-400 font-mono hidden sm:inline">
                Case: <strong className="text-white">{analysisResult.image_name}</strong> ({analysisResult.modality.toUpperCase()})
              </span>
            </div>

            {/* Diagnostic View Tabs */}
            <div className="flex items-center flex-wrap gap-1 bg-cyber-900/90 p-1 rounded-xl border border-slate-800 text-xs font-medium">
              <button
                onClick={() => setActiveTab('scorecard')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  activeTab === 'scorecard' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Evidence Scorecard (USP)
              </button>

              <button
                onClick={() => setActiveTab('diagnostics')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  activeTab === 'diagnostics' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {analysisResult.modality === 'video' ? 'Video Deepfake Diagnostics' :
                 analysisResult.modality === 'audio' ? 'Acoustic Voice Diagnostics' :
                 analysisResult.modality === 'text' ? 'Text Stylometry Diagnostics' :
                 'Image Technical Diagnostics'}
              </button>

              <button
                onClick={() => setActiveTab('metadata')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  activeTab === 'metadata' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                File & Metadata
              </button>

              <button
                onClick={() => setActiveTab('ai')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  activeTab === 'ai' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Gemini AI Reasoning
              </button>

              {analysisResult.caption_comparison?.caption_provided && (
                <button
                  onClick={() => setActiveTab('caption')}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    activeTab === 'caption' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Claim Cross-Check
                </button>
              )}
            </div>
          </div>

          {/* Active Diagnostic Views */}
          {activeTab === 'scorecard' && (
            <EvidenceScorecardView analysis={analysisResult} />
          )}

          {activeTab === 'diagnostics' && (
            <>
              {analysisResult.modality === 'video' && analysisResult.video_diagnostics && (
                <VideoViewer video={analysisResult.video_diagnostics} />
              )}
              {analysisResult.modality === 'audio' && analysisResult.audio_diagnostics && (
                <AudioViewer audio={analysisResult.audio_diagnostics} />
              )}
              {analysisResult.modality === 'text' && analysisResult.text_diagnostics && (
                <TextViewer text={analysisResult.text_diagnostics} />
              )}
              {analysisResult.modality === 'image' && (
                <TechnicalViewer technical={analysisResult.technical} />
              )}
            </>
          )}

          {activeTab === 'metadata' && (
            <MetadataViewer metadata={analysisResult.metadata} />
          )}

          {activeTab === 'ai' && (
            <AIVisionViewer aiResult={analysisResult.ai_analysis} />
          )}

          {activeTab === 'caption' && (
            <CaptionCrossVerifier captionResult={analysisResult.caption_comparison} />
          )}

        </div>
      )}

      {/* Animated Multimodal Progress Stepper Overlay */}
      {isAnalyzing && (
        <div className="fixed inset-0 z-50 bg-cyber-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-card-active max-w-md w-full p-6 rounded-2xl border border-cyan-500/40 space-y-5 shadow-2xl text-center">
            
            <div className="w-16 h-16 rounded-2xl bg-cyan-950 border border-cyan-500/40 flex items-center justify-center mx-auto shadow-lg shadow-cyan-500/20">
              <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white tracking-wide">
                Executing {selectedModality.toUpperCase()} Forensics
              </h3>
              <p className="text-xs text-slate-400">
                Multi-layer inspection across mathematical signal, cryptographic and AI pipelines
              </p>
            </div>

            {/* Stepper Display */}
            <div className="space-y-2 text-left bg-cyber-950/70 p-3.5 rounded-xl border border-slate-800">
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
              TruthLens Multimodal Forensic Core • Problem Statement PS04
            </p>

          </div>
        </div>
      )}

    </div>
  );
};
