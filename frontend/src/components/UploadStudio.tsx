import React, { useState, useRef } from 'react';
import { 
  UploadCloud, Image as ImageIcon, Sparkles, FileText, CheckCircle2, 
  AlertCircle, Loader2, ArrowRight, RefreshCw, Layers, ShieldCheck, Download, Trash2
} from 'lucide-react';
import { FullAnalysisResponse, UserProfile } from '../types';
import { apiService } from '../services/api';
import { EvidenceScorecardView } from './EvidenceScorecardView';
import { MetadataViewer } from './MetadataViewer';
import { TechnicalViewer } from './TechnicalViewer';
import { AIVisionViewer } from './AIVisionViewer';
import { CaptionCrossVerifier } from './CaptionCrossVerifier';

interface UploadStudioProps {
  currentUser: UserProfile | null;
  onAnalysisComplete?: (result: FullAnalysisResponse) => void;
}

const ANALYSIS_STEPS = [
  'Verifying binary integrity & generating SHA-256 fingerprint...',
  'Extracting embedded EXIF headers & generation metadata tags...',
  'Executing Error Level Analysis (ELA 90%) & spatial noise variance...',
  'Interrogating Gemini Multimodal Vision for physical/lighting coherence...',
  'Cross-verifying narrative claims against visual ground truth...',
  'Synthesizing Evidence Scorecard & compiling cryptographic PDF report...'
];

export const UploadStudio: React.FC<UploadStudioProps> = ({ currentUser, onAnalysisComplete }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState<string>('');
  const [sourceContext, setSourceContext] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [analysisResult, setAnalysisResult] = useState<FullAnalysisResponse | null>(null);
  const [activeTab, setActiveTab] = useState<'scorecard' | 'metadata' | 'technical' | 'vision' | 'caption'>('scorecard');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (file: File) => {
    setErrorMsg(null);
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/tiff'];
    if (!validTypes.includes(file.type)) {
      setErrorMsg('Please upload a valid image (JPG, PNG, WEBP, or TIFF).');
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      setErrorMsg('File exceeds 25MB maximum limit.');
      return;
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
    if (!selectedFile) return;
    setIsAnalyzing(true);
    setErrorMsg(null);
    setCurrentStepIndex(0);

    // Step simulation ticker
    const timer = setInterval(() => {
      setCurrentStepIndex(prev => (prev < ANALYSIS_STEPS.length - 1 ? prev + 1 : prev));
    }, 1100);

    try {
      const result = await apiService.analyzeImage(
        selectedFile,
        caption,
        sourceContext,
        currentUser?.id
      );
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
    setCaption('');
    setSourceContext('');
    setAnalysisResult(null);
    setErrorMsg(null);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      
      {/* If no analysis result, show Upload & Context Studio */}
      {!analysisResult ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Drag & Drop Zone + Preview */}
          <div className="lg:col-span-7 space-y-4">
            
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                <UploadCloud className="w-6 h-6 text-cyan-400" />
                <span>Media Forensic Ingestion</span>
              </h2>
              <p className="text-xs text-slate-400">
                Upload target image for deep multi-layer examination and tamper verification
              </p>
            </div>

            {/* Dropzone */}
            {!previewUrl ? (
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
                  accept="image/jpeg,image/png,image/webp,image/tiff"
                  onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
                />
                
                <div className="w-16 h-16 rounded-2xl bg-cyan-950/70 border border-cyan-500/30 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:border-cyan-400 transition shadow-lg shadow-cyan-950">
                  <ImageIcon className="w-8 h-8 text-cyan-400" />
                </div>
                
                <h3 className="text-base font-semibold text-white mb-1">
                  Drag and drop suspect image here
                </h3>
                <p className="text-xs text-slate-400 mb-4 max-w-xs">
                  Supports JPG, PNG, WEBP, and TIFF up to 25MB. Preserves raw binary stream.
                </p>

                <button 
                  type="button" 
                  className="px-4 py-2 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-semibold transition"
                >
                  Browse Local Files
                </button>
              </div>
            ) : (
              <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-3 relative">
                <div className="relative rounded-xl overflow-hidden bg-cyber-950 flex items-center justify-center max-h-[420px] border border-slate-800">
                  <img 
                    src={previewUrl} 
                    alt="Target preview" 
                    className="max-h-[400px] w-auto object-contain"
                  />
                  <button
                    onClick={handleReset}
                    className="absolute top-3 right-3 p-2 rounded-lg bg-cyber-950/80 border border-slate-700 text-slate-300 hover:text-rose-400 transition"
                    title="Remove Image"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 font-mono px-1">
                  <span>File: <strong className="text-white">{selectedFile?.name}</strong></span>
                  <span>Size: {(Number(selectedFile?.size) / (1024 * 1024)).toFixed(2)} MB</span>
                </div>
              </div>
            )}

            {/* Error Message */}
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-xs text-rose-300 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

          </div>

          {/* Right Column: Context & Start Trigger */}
          <div className="lg:col-span-5 space-y-4">
            
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-5">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-cyan-400" />
                  <span>Narrative & Context (Optional)</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Provide accompanying claim or headline to enable Layer 4 Cross-Verification
                </p>
              </div>

              {/* Caption Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span>Caption, Claim or Headline</span>
                  <span className="text-[10px] text-slate-500 font-mono">Cross-Verification</span>
                </label>
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="e.g. 'Photograph shows severe flooding in downtown Sydney yesterday afternoon during tropical storm.'"
                  rows={3}
                  className="w-full bg-cyber-950/80 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 transition resize-none"
                />
              </div>

              {/* Source Context Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Source Channel or Provenance
                </label>
                <input
                  type="text"
                  value={sourceContext}
                  onChange={(e) => setSourceContext(e.target.value)}
                  placeholder="e.g. 'Twitter viral post', 'WhatsApp forward', 'Breaking news thread'"
                  className="w-full bg-cyber-950/80 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 transition"
                />
              </div>

              {/* Multi-layer inspection description */}
              <div className="p-3.5 rounded-xl bg-cyber-950/50 border border-slate-800 text-[11px] text-slate-400 space-y-1.5">
                <span className="font-semibold text-cyan-400 block font-mono">Automated 5-Layer Inspection Pipeline:</span>
                <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-300 font-mono">
                  <span>✓ 1. EXIF & SHA-256</span>
                  <span>✓ 2. ELA & Sensor Noise</span>
                  <span>✓ 3. Gemini Vision</span>
                  <span>✓ 4. Cross-Verification</span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                disabled={!selectedFile || isAnalyzing}
                onClick={handleStartAnalysis}
                className={`w-full py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center space-x-2 transition shadow-lg ${
                  selectedFile && !isAnalyzing
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-cyan-500/25 cursor-pointer'
                    : 'bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed'
                }`}
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-cyan-300" />
                    <span>Executing Forensics Engine...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-cyan-200" />
                    <span>Commence Forensic Investigation</span>
                  </>
                )}
              </button>

            </div>

            {/* Quick Demo Pre-load tips */}
            <div className="p-4 rounded-xl border border-slate-800/80 bg-cyber-950/40 text-xs text-slate-400 space-y-1">
              <span className="font-semibold text-slate-300 block">💡 Hackathon Presentation Tip:</span>
              <p>
                To demonstrate Layer 4 Cross-Verification, upload an image of a sunny park and enter a caption claiming "Heavy monsoon flood submerges city". TruthLens will immediately flag the narrative mismatch!
              </p>
            </div>

          </div>

        </div>
      ) : (
        /* Results Mode */
        <div className="space-y-6">
          
          {/* Top Navigation Bar for Results */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <button
                onClick={handleReset}
                className="px-3 py-1.5 rounded-lg border border-slate-700 bg-cyber-900 text-slate-300 hover:text-white hover:border-cyan-500/50 text-xs font-semibold flex items-center space-x-1.5 transition"
              >
                <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
                <span>New Investigation</span>
              </button>
              <span className="text-xs text-slate-400 font-mono hidden sm:inline">
                Target: <strong className="text-white">{analysisResult.image_name}</strong>
              </span>
            </div>

            {/* Diagnostic View Switcher Tabs */}
            <div className="flex items-center flex-wrap gap-1 bg-cyber-900/90 p-1 rounded-xl border border-slate-800 text-xs font-medium">
              {[
                { id: 'scorecard', label: 'Evidence Scorecard (USP)' },
                { id: 'metadata', label: 'Layer 1: Metadata' },
                { id: 'technical', label: 'Layer 2: Technical' },
                { id: 'vision', label: 'Layer 3: AI Vision' },
                { id: 'caption', label: 'Layer 4: Cross-Check' },
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id as any)}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    activeTab === t.id
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Views */}
          {activeTab === 'scorecard' && (
            <EvidenceScorecardView analysis={analysisResult} />
          )}

          {activeTab === 'metadata' && (
            <MetadataViewer metadata={analysisResult.metadata} />
          )}

          {activeTab === 'technical' && (
            <TechnicalViewer technical={analysisResult.technical} />
          )}

          {activeTab === 'vision' && (
            <AIVisionViewer aiResult={analysisResult.ai_analysis} />
          )}

          {activeTab === 'caption' && (
            <CaptionCrossVerifier captionResult={analysisResult.caption_comparison} />
          )}

        </div>
      )}

      {/* Analysis Live Progress Overlay Modal */}
      {isAnalyzing && (
        <div className="fixed inset-0 z-50 bg-cyber-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-card-active max-w-md w-full p-6 rounded-2xl border border-cyan-500/40 space-y-5 shadow-2xl text-center">
            
            <div className="w-16 h-16 rounded-2xl bg-cyan-950 border border-cyan-500/40 flex items-center justify-center mx-auto shadow-lg shadow-cyan-500/20">
              <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white tracking-wide">
                Executing Forensic Examination
              </h3>
              <p className="text-xs text-slate-400">
                Multi-layer inspection across physical, cryptographic and AI pipelines
              </p>
            </div>

            {/* Stepper Display */}
            <div className="space-y-2 text-left bg-cyber-950/70 p-3.5 rounded-xl border border-slate-800">
              {ANALYSIS_STEPS.map((step, idx) => (
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
              TruthLens PS04 Engine • Non-destructive Analysis
            </p>

          </div>
        </div>
      )}

    </div>
  );
};
